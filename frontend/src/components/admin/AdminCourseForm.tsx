'use client'
import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { upsertCourse, deleteCourse } from '@/actions/courses'
import { LICENSE_STRUCTURE, LICENSE_YEARS } from '@/constants'
import { ImageIcon, Trash2Icon, UploadCloudIcon, XCircleIcon } from 'lucide-react'
import type { Course, LicenseYear } from '@/types'
import { useAdminT } from '@/components/admin/AdminI18n'

interface Props {
  course?: Course
}

const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024
const ALLOWED_THUMBNAIL_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

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
      else reject(new Error(`Erreur ${xhr.status}`))
    })
    xhr.addEventListener('error', () => reject(new Error('Erreur reseau')))
    xhr.addEventListener('abort', () => reject(new Error('Upload annule')))
    xhr.send(file)
  })
}

export default function AdminCourseForm({ course }: Props) {
  const router = useRouter()
  const adminT = useAdminT()
  const [pending, startTransition] = useTransition()
  const [deleting, startDelete] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [thumbnailUrl, setThumbnailUrl] = useState(course?.thumbnail_url ?? '')
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState(course?.thumbnail_url ?? '')
  const [thumbnailError, setThumbnailError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [licenseYear, setLicenseYear] = useState<LicenseYear>(course?.license_year ?? 'L1')
  const [semester, setSemester] = useState(course?.semester ?? 'S1')

  const availableSemesters = LICENSE_STRUCTURE[licenseYear]

  useEffect(() => {
    if (!selectedThumbnail) {
      setPreviewUrl(thumbnailUrl)
      return
    }

    const objectUrl = URL.createObjectURL(selectedThumbnail)
    setPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [selectedThumbnail, thumbnailUrl])

  function validateThumbnail(file: File) {
    if (!ALLOWED_THUMBNAIL_TYPES.has(file.type)) {
      return adminT('courses.invalidImage')
    }
    if (file.size > MAX_THUMBNAIL_SIZE) {
      return adminT('courses.acceptedImages')
    }
    return ''
  }

  function handleThumbnailSelect(file: File | null) {
    if (!file) return

    const error = validateThumbnail(file)
    if (error) {
      setThumbnailError(error)
      setSelectedThumbnail(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setThumbnailError('')
    setSelectedThumbnail(file)
  }

  function clearThumbnail() {
    setThumbnailUrl('')
    setSelectedThumbnail(null)
    setThumbnailError('')
    setUploadProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function uploadThumbnail(file: File) {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const response = await fetch('/api/admin/course-thumbnail-upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ext,
        contentType: file.type,
        size: file.size,
      }),
    })

    const body = await response.json()
    if (!response.ok) {
      throw new Error(body.error ?? adminT('courses.uploading'))
    }

    await uploadWithProgress(body.signedUrl, file, setUploadProgress)
    return body.publicUrl as string
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    setThumbnailError('')
    let nextThumbnailUrl = thumbnailUrl

    if (selectedThumbnail) {
      setUploading(true)
      setUploadProgress(0)
      try {
        nextThumbnailUrl = await uploadThumbnail(selectedThumbnail)
      } catch (error) {
        setThumbnailError(error instanceof Error ? error.message : adminT('courses.uploading'))
        setUploading(false)
        return
      }
      setUploading(false)
    }

    fd.set('thumbnail_url', nextThumbnailUrl)

    startTransition(async () => {
      const result = await upsertCourse(fd, course?.id)
      if (result.success) {
        router.push('/admin/courses')
        return
      }

      setThumbnailError(result.error === 'invalid_thumbnail_url'
        ? adminT('courses.invalidImage')
        : adminT('courses.saveFailed'))
    })
  }

  function handleDelete() {
    if (!course || !confirm(adminT('courses.deleteConfirm'))) return
    startDelete(async () => {
      const result = await deleteCourse(course.id)
      if (result.success) {
        router.push('/admin/courses')
      } else {
        setThumbnailError(adminT('common.error'))
      }
    })
  }

  const field = 'w-full rounded-xl border border-admin-border bg-admin-bg text-white px-4 py-3 text-sm placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
  const label = 'block text-xs font-semibold text-slate-400 mb-1.5'
  const isSubmitting = pending || uploading

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={label}>{adminT('common.title')} *</label>
        <input name="title" required defaultValue={course?.title} placeholder={adminT('courses.courseTitle')} className={field} />
      </div>

      <div>
        <label className={label}>{adminT('common.description')}</label>
        <textarea
          name="description"
          defaultValue={course?.description ?? ''}
          placeholder={adminT('common.description')}
          rows={3}
          className={field + ' resize-none'}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={label}>{adminT('common.licenseYear')} *</label>
          <select
            name="license_year"
            value={licenseYear}
            onChange={event => {
              const nextYear = event.target.value as LicenseYear
              setLicenseYear(nextYear)
              setSemester(LICENSE_STRUCTURE[nextYear][0])
            }}
            className={field}
            required
          >
            {LICENSE_YEARS.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>{adminT('common.semester')} *</label>
          <select
            name="semester"
            value={semester}
            onChange={event => setSemester(event.target.value as Course['semester'])}
            className={field}
            required
          >
            {availableSemesters.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={label}>{adminT('common.thumbnail')}</label>
        <input type="hidden" name="thumbnail_url" value={thumbnailUrl} />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={event => handleThumbnailSelect(event.target.files?.[0] ?? null)}
        />

        <div
          onDragOver={event => event.preventDefault()}
          onDrop={event => {
            event.preventDefault()
            handleThumbnailSelect(event.dataTransfer.files?.[0] ?? null)
          }}
          className="rounded-lg border border-dashed border-admin-border bg-admin-bg p-4"
        >
          {previewUrl ? (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-lg border border-admin-border bg-black/20">
                <div className="aspect-video">
                  <img
                    src={previewUrl}
                    alt={adminT('common.thumbnail')}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
                >
                  <UploadCloudIcon size={15} />
                  {adminT('common.chooseImage')}
                </button>
                <button
                  type="button"
                  onClick={clearThumbnail}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20"
                >
                  <Trash2Icon size={15} />
                  {adminT('common.remove')}
                </button>
                {selectedThumbnail && (
                  <span className="min-w-0 flex-1 truncate text-xs text-slate-400">
                    {selectedThumbnail.name}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-admin-border/70 bg-black/10 px-5 py-8 text-center transition-colors hover:border-primary/60 hover:bg-primary/5"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ImageIcon size={24} />
              </span>
              <span className="text-sm font-semibold text-white">{adminT('common.chooseImage')}</span>
              <span className="text-xs text-slate-500">{adminT('courses.acceptedImages')}</span>
            </button>
          )}

          {uploading && (
            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">{adminT('courses.uploading')} {uploadProgress}%</p>
            </div>
          )}

          {thumbnailError && (
            <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-red-400">
              <XCircleIcon size={13} />
              {thumbnailError}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          name="is_published"
          id="is_published"
          value="true"
          defaultChecked={course?.is_published}
          className="w-4 h-4 rounded accent-primary"
        />
        <label htmlFor="is_published" className="text-sm text-slate-300">{adminT('courses.publishCourse')}</label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60"
        >
          {uploading ? `${adminT('courses.uploading')} ${uploadProgress}%` : pending ? `${adminT('common.loading')}...` : course ? adminT('courses.updateButton') : adminT('courses.createButton')}
        </button>
        {course && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-5 bg-red-600/10 hover:bg-red-600/20 text-red-400 font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {deleting ? '...' : adminT('common.delete')}
          </button>
        )}
      </div>
    </form>
  )
}
