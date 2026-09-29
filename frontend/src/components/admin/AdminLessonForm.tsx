'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircleIcon, FileTextIcon, HeadphonesIcon, ImageIcon, UploadCloudIcon, VideoIcon, XCircleIcon } from 'lucide-react'
import { upsertLesson, deleteLesson } from '@/actions/lessons'
import { classifyVideoUrl, extractYoutubeId } from '@/lib/utils'
import { useAdminT } from '@/components/admin/AdminI18n'
import type { Course, Lesson } from '@/types'

interface Props {
  lesson?: Lesson
  courses: Pick<Course, 'id' | 'title' | 'license_year' | 'semester'>[]
  defaultCourseId?: string
}

function uploadWithProgress(
  signedUrl: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', signedUrl)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.upload.addEventListener('progress', event => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
    })
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Error ${xhr.status}`))
    })
    xhr.addEventListener('error', () => reject(new Error('Network error')))
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')))
    xhr.send(file)
  })
}

export default function AdminLessonForm({ lesson, courses, defaultCourseId }: Props) {
  const router = useRouter()
  const adminT = useAdminT()
  const [pending, startTransition] = useTransition()
  const [deleting, startDelete] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachmentInputRef = useRef<HTMLInputElement>(null)

  const hasStorageVideo = Boolean(lesson?.video_bucket && lesson?.video_path)
  const [mediaKind, setMediaKind] = useState<'video' | 'audio'>(lesson?.video_type === 'audio' ? 'audio' : 'video')
  const [videoMode, setVideoMode] = useState<'storage' | 'url'>(hasStorageVideo ? 'storage' : 'url')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedPath, setUploadedPath] = useState<string | null>(lesson?.video_path ?? null)
  const [uploadedBucket, setUploadedBucket] = useState<string | null>(lesson?.video_bucket ?? null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [videoUrlError, setVideoUrlError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [currentVideoUrl, setCurrentVideoUrl] = useState(lesson?.video_url ?? '')
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [attachmentPath, setAttachmentPath] = useState<string | null>(lesson?.attachment_path ?? null)
  const [attachmentBucket, setAttachmentBucket] = useState<string | null>(lesson?.attachment_bucket ?? null)
  const [attachmentType, setAttachmentType] = useState<'image' | 'pdf' | null>(lesson?.attachment_type ?? null)
  const [attachmentName, setAttachmentName] = useState(lesson?.attachment_name ?? '')
  const [attachmentProgress, setAttachmentProgress] = useState(0)
  const [attachmentUploading, setAttachmentUploading] = useState(false)
  const [attachmentError, setAttachmentError] = useState('')

  const field = 'w-full rounded-xl border border-admin-border bg-admin-bg text-white px-4 py-3 text-sm placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
  const label = 'block text-xs font-semibold text-slate-400 mb-1.5'
  const isSubmitting = pending || uploading || attachmentUploading
  const courseGroups = courses.reduce<Record<string, typeof courses>>((groups, course) => {
    const key = `${course.license_year} · ${course.semester}`
    groups[key] = [...(groups[key] ?? []), course]
    return groups
  }, {})

  function validateVideoUrl(raw: string) {
    const url = raw.trim()
    if (!url) return ''
    return classifyVideoUrl(url) === 'invalid' ? adminT('lessons.acceptedVideoUrls') : ''
  }

  function switchMode(mode: 'storage' | 'url') {
    setVideoMode(mode)
    setUploadError('')
    setVideoUrlError('')
  }

  function switchMediaKind(kind: 'video' | 'audio') {
    if (kind !== mediaKind) {
      setSelectedFile(null)
      setUploadedPath(null)
      setUploadedBucket(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    setMediaKind(kind)
    if (kind === 'audio') setVideoMode('storage')
    setUploadError('')
    setVideoUrlError('')
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    if (file && (!file.type.startsWith(`${mediaKind}/`) || file.size > 500 * 1024 * 1024)) {
      setSelectedFile(null)
      setUploadError(adminT(mediaKind === 'audio' ? 'lessons.invalidAudio' : 'lessons.invalidVideo'))
      event.target.value = ''
      return
    }
    setSelectedFile(file)
    setUploadError('')
    setUploadProgress(0)
  }

  function handleAttachmentSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    if (!file) return

    const nextType = file.type === 'application/pdf'
      ? 'pdf'
      : file.type.startsWith('image/')
        ? 'image'
        : null

    if (!nextType || file.size > 25 * 1024 * 1024) {
      setAttachmentFile(null)
      setAttachmentError(adminT('lessons.invalidAttachment'))
      event.target.value = ''
      return
    }

    setAttachmentFile(file)
    setAttachmentType(nextType)
    setAttachmentName(file.name)
    setAttachmentError('')
    setAttachmentProgress(0)
  }

  function clearAttachment() {
    setAttachmentFile(null)
    setAttachmentPath(null)
    setAttachmentBucket(null)
    setAttachmentType(null)
    setAttachmentName('')
    setAttachmentProgress(0)
    setAttachmentError('')
    if (attachmentInputRef.current) attachmentInputRef.current.value = ''
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fd = new FormData(event.currentTarget)
    setSaveError('')

    if (videoMode === 'storage') {
      if (selectedFile) {
        setUploading(true)
        setUploadError('')
        setUploadProgress(0)
        try {
          const ext = selectedFile.name.split('.').pop() ?? (mediaKind === 'audio' ? 'mp3' : 'mp4')
          const response = await fetch('/api/admin/upload-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ext,
              contentType: selectedFile.type,
              mediaType: mediaKind,
              size: selectedFile.size,
            }),
          })
          if (!response.ok) {
            const body = await response.json().catch(() => ({}))
            throw new Error(body.error ?? adminT('common.error'))
          }
          const { path, bucket, signedUrl } = await response.json()
          await uploadWithProgress(signedUrl, selectedFile, setUploadProgress)
          setUploadedPath(path)
          setUploadedBucket(bucket)
          fd.set('video_bucket', bucket)
          fd.set('video_path', path)
          fd.set('video_type', mediaKind === 'audio' ? 'audio' : 'storage')
        } catch (error) {
          setUploadError(error instanceof Error ? error.message : adminT('common.error'))
          setUploading(false)
          return
        }
        setUploading(false)
      } else if (uploadedPath && uploadedBucket) {
        fd.set('video_bucket', uploadedBucket)
        fd.set('video_path', uploadedPath)
        fd.set('video_type', mediaKind === 'audio' ? 'audio' : 'storage')
      }
      fd.delete('video_url')
    } else {
      const rawUrl = (fd.get('video_url') as string ?? '').trim()
      const error = validateVideoUrl(rawUrl)
      if (error) {
        setVideoUrlError(error)
        return
      }
      setVideoUrlError('')

      const type = classifyVideoUrl(rawUrl)
      if (type === 'youtube') {
        const id = extractYoutubeId(rawUrl)
        if (id) {
          fd.set('video_url', id)
          fd.set('video_type', 'youtube')
        }
      } else {
        fd.set('video_type', type)
      }

      fd.delete('video_bucket')
      fd.delete('video_path')
    }

    if (attachmentFile && attachmentType) {
      setAttachmentUploading(true)
      setAttachmentError('')
      setAttachmentProgress(0)
      try {
        const ext = attachmentFile.name.split('.').pop() ?? (attachmentType === 'pdf' ? 'pdf' : 'jpg')
        const response = await fetch('/api/admin/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ext,
            contentType: attachmentFile.type,
            mediaType: attachmentType,
            size: attachmentFile.size,
          }),
        })
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error ?? adminT('common.error'))
        }
        const { path, bucket, signedUrl } = await response.json()
        await uploadWithProgress(signedUrl, attachmentFile, setAttachmentProgress)
        setAttachmentPath(path)
        setAttachmentBucket(bucket)
        fd.set('attachment_bucket', bucket)
        fd.set('attachment_path', path)
        fd.set('attachment_type', attachmentType)
        fd.set('attachment_name', attachmentFile.name)
      } catch (error) {
        setAttachmentError(error instanceof Error ? error.message : adminT('common.error'))
        setAttachmentUploading(false)
        return
      }
      setAttachmentUploading(false)
    } else if (attachmentPath && attachmentBucket && attachmentType) {
      fd.set('attachment_bucket', attachmentBucket)
      fd.set('attachment_path', attachmentPath)
      fd.set('attachment_type', attachmentType)
      fd.set('attachment_name', attachmentName)
    } else {
      fd.delete('attachment_bucket')
      fd.delete('attachment_path')
      fd.delete('attachment_type')
      fd.delete('attachment_name')
    }

    startTransition(async () => {
      const result = await upsertLesson(fd, lesson?.id)
      if (result.success) {
        router.push('/admin/lessons')
      } else {
        setSaveError(adminT('lessons.saveFailed'))
      }
    })
  }

  function handleDelete() {
    if (!lesson || !confirm(adminT('lessons.deleteConfirm'))) return
    startDelete(async () => {
      const result = await deleteLesson(lesson.id)
      if (result.success) {
        router.push('/admin/lessons')
      } else {
        setSaveError(adminT('common.error'))
      }
    })
  }

  const youtubeId = classifyVideoUrl(currentVideoUrl) === 'youtube' ? extractYoutubeId(currentVideoUrl) : null

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={label}>{adminT('common.course')} *</label>
        <select name="course_id" required defaultValue={lesson?.course_id ?? defaultCourseId ?? ''} className={field}>
          <option value="">- {adminT('lessons.chooseCourse')} -</option>
          {Object.entries(courseGroups).map(([group, groupCourses]) => (
            <optgroup key={group} label={group}>
              {groupCourses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}
            </optgroup>
          ))}
        </select>
      </div>

      <div>
        <label className={label}>{adminT('common.title')} *</label>
        <input name="title" required defaultValue={lesson?.title} placeholder={adminT('lessons.lessonTitle')} className={field} />
      </div>

      <div>
        <label className={label}>{adminT('common.description')}</label>
        <textarea
          name="description"
          defaultValue={lesson?.description ?? ''}
          placeholder={adminT('common.description')}
          rows={3}
          className={`${field} resize-none`}
        />
      </div>

      <div>
        <label className={label}>{adminT('lessons.contentType')}</label>
        <div className="mb-4 grid grid-cols-2 gap-2" role="group" aria-label={adminT('lessons.contentType')}>
          <button
            type="button"
            onClick={() => switchMediaKind('video')}
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-semibold transition-colors ${mediaKind === 'video' ? 'border-primary bg-primary text-white' : 'border-admin-border bg-admin-bg text-slate-400 hover:text-white'}`}
          >
            <VideoIcon size={16} /> {adminT('lessons.video')}
          </button>
          <button
            type="button"
            onClick={() => switchMediaKind('audio')}
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-semibold transition-colors ${mediaKind === 'audio' ? 'border-primary bg-primary text-white' : 'border-admin-border bg-admin-bg text-slate-400 hover:text-white'}`}
          >
            <HeadphonesIcon size={16} /> {adminT('lessons.audio')}
          </button>
        </div>

        <label className={label}>{adminT('lessons.mediaSource')}</label>
        {mediaKind === 'video' && (
        <div className="mb-3 flex overflow-hidden rounded-xl border border-admin-border text-xs font-semibold">
          <button
            type="button"
            onClick={() => switchMode('storage')}
            className={`flex-1 py-2.5 transition-colors ${videoMode === 'storage' ? 'bg-primary text-white' : 'bg-admin-bg text-slate-400 hover:text-white'}`}
          >
            {adminT('lessons.storageFile')}
          </button>
          <button
            type="button"
            onClick={() => switchMode('url')}
            className={`flex-1 border-s border-admin-border py-2.5 transition-colors ${videoMode === 'url' ? 'bg-primary text-white' : 'bg-admin-bg text-slate-400 hover:text-white'}`}
          >
            {adminT('lessons.externalUrl')}
          </button>
        </div>
        )}

        {videoMode === 'storage' && (
          <div className="space-y-2">
            {uploadedPath && !selectedFile && (
              <div className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-2">
                <CheckCircleIcon size={14} className="shrink-0 text-green-400" />
                <span className="flex-1 truncate text-xs text-green-400">{uploadedPath}</span>
                <button
                  type="button"
                  onClick={() => { setUploadedPath(null); setUploadedBucket(null) }}
                  className="shrink-0 text-slate-500 hover:text-slate-300"
                >
                  <XCircleIcon size={14} />
                </button>
              </div>
            )}

            <label className={`flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 transition-colors ${selectedFile ? 'border-primary bg-primary/5' : 'border-admin-border bg-admin-bg hover:border-primary/60'}`}>
              <input
                ref={fileInputRef}
                type="file"
                accept={mediaKind === 'audio'
                  ? 'audio/mpeg,audio/mp4,audio/aac,audio/ogg,audio/webm,audio/wav,audio/flac,.mp3,.m4a,.aac,.ogg,.oga,.webm,.wav,.flac'
                  : 'video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.ogv,.mov'}
                onChange={handleFileSelect}
                className="sr-only"
              />
              <UploadCloudIcon size={24} className={selectedFile ? 'text-primary' : 'text-slate-500'} />
              {selectedFile ? (
                <div className="text-center">
                  <p className="text-xs font-semibold text-white">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-xs font-semibold text-slate-300">{adminT('lessons.uploadHint')}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {adminT(mediaKind === 'audio' ? 'lessons.audioUploadTypes' : 'lessons.videoUploadTypes')}
                  </p>
                </div>
              )}
            </label>

            {uploading && (
              <div>
                <div className="h-1.5 overflow-hidden rounded-full bg-admin-border">
                  <div className="h-full bg-primary transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                </div>
                <p className="mt-1 text-xs text-slate-400">{adminT('courses.uploading')} {uploadProgress}%</p>
              </div>
            )}

            {uploadError && (
              <p className="flex items-center gap-1 text-xs text-red-400">
                <XCircleIcon size={12} /> {uploadError}
              </p>
            )}

            <p className="text-xs text-slate-500">{adminT('lessons.privateMediaHint')}</p>
          </div>
        )}

        {videoMode === 'url' && (
          <div>
            <input
              name="video_url"
              value={currentVideoUrl}
              placeholder={adminT('lessons.videoUrl')}
              className={field + (videoUrlError ? ' border-red-500 focus:border-red-500 focus:ring-red-500' : '')}
              onChange={event => {
                setCurrentVideoUrl(event.target.value)
                if (videoUrlError) setVideoUrlError('')
              }}
            />
            {youtubeId && (
              <div className="mt-2 flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400">
                <CheckCircleIcon size={12} className="shrink-0 text-amber-400" />
                <span className="truncate">YouTube ID: <code className="select-all rounded bg-amber-950/40 px-1.5 py-0.5 font-mono">{youtubeId}</code></span>
              </div>
            )}
            <p className={`mt-1.5 text-xs ${videoUrlError ? 'text-red-400' : 'text-slate-500'}`}>
              {videoUrlError || adminT('lessons.acceptedVideoUrls')}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className={label}>{adminT('lessons.attachment')}</label>
        <p className="text-xs text-slate-500">{adminT('lessons.attachmentHint')}</p>

        {(attachmentFile || attachmentPath) && (
          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-3 py-3">
            {attachmentType === 'pdf'
              ? <FileTextIcon size={18} className="shrink-0 text-primary" />
              : <ImageIcon size={18} className="shrink-0 text-primary" />
            }
            <span className="min-w-0 flex-1 truncate text-xs font-semibold text-white">
              {attachmentFile?.name || attachmentName || attachmentPath}
            </span>
            <button
              type="button"
              onClick={clearAttachment}
              className="shrink-0 text-slate-400 transition-colors hover:text-red-400"
              aria-label={adminT('lessons.removeAttachment')}
            >
              <XCircleIcon size={17} />
            </button>
          </div>
        )}

        <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-admin-border bg-admin-bg px-4 py-5 transition-colors hover:border-primary/60">
          <input
            ref={attachmentInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"
            onChange={handleAttachmentSelect}
            className="sr-only"
          />
          <UploadCloudIcon size={22} className="text-slate-500" />
          <span className="text-xs font-semibold text-slate-300">{adminT('lessons.uploadHint')}</span>
          <span className="text-xs text-slate-500">{adminT('lessons.attachmentUploadTypes')}</span>
        </label>

        {attachmentUploading && (
          <div>
            <div className="h-1.5 overflow-hidden rounded-full bg-admin-border">
              <div className="h-full bg-primary transition-all" style={{ width: `${attachmentProgress}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-400">{adminT('courses.uploading')} {attachmentProgress}%</p>
          </div>
        )}

        {attachmentError && (
          <p className="flex items-center gap-1 text-xs text-red-400">
            <XCircleIcon size={12} /> {attachmentError}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>{adminT('common.duration')} (s)</label>
          <input name="duration" type="number" min="0" defaultValue={lesson?.duration ?? 0} className={field} />
        </div>
        <div>
          <label className={label}>Order</label>
          <input name="order_index" type="number" min="0" defaultValue={lesson?.order_index ?? 0} className={field} />
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" name="is_protected" value="true" defaultChecked={lesson?.is_protected ?? true} className="h-4 w-4 rounded accent-primary" />
          <span className="text-sm text-slate-300">{adminT('common.protected')}</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" name="is_downloadable" value="true" defaultChecked={lesson?.is_downloadable} className="h-4 w-4 rounded accent-primary" />
          <span className="text-sm text-slate-300">{adminT('common.downloadable')}</span>
        </label>
      </div>

      {saveError && (
        <p className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400">
          <XCircleIcon size={13} /> {saveError}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {uploading
            ? `${adminT('courses.uploading')} ${uploadProgress}%`
            : attachmentUploading
              ? `${adminT('courses.uploading')} ${attachmentProgress}%`
              : pending
                ? `${adminT('common.loading')}...`
                : lesson
                  ? adminT('lessons.updateButton')
                  : adminT('lessons.createButton')}
        </button>
        {lesson && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-xl bg-red-600/10 px-5 py-3 text-sm font-semibold text-red-400 transition-colors hover:bg-red-600/20"
          >
            {deleting ? '...' : adminT('common.delete')}
          </button>
        )}
      </div>
    </form>
  )
}
