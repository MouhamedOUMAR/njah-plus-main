import { redirect } from 'next/navigation'

/**
 * The standalone verify-OTP flow is no longer used.
 * OTP verification happens inline in the multi-step register page (step 3).
 * Redirect any direct visitors to the register flow.
 */
export default function VerifyOtpPage() {
  redirect('/register')
}
