import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'

type RegistrationResponse = { message?: string }

export function SellerRegistrationPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [shopName, setShopName] = useState('')
  const [shopAddress, setShopAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('1')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (password !== passwordConfirmation) {
      setError('Passwords do not match.')
      return
    }
    if (!termsAccepted) {
      setError('Please accept the terms and conditions.')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post<RegistrationResponse>('/seller/register', {
        name,
        email,
        password,
        shopName,
        shopAddress,
        phone,
        countryCode,
      })
      setMessage(data.message || 'Registration submitted. Your seller account is pending approval.')
      setPassword('')
      setPasswordConfirmation('')
    } catch (registrationError: any) {
      setError(registrationError?.response?.data?.message || registrationError?.message || 'Unable to register your shop.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#edf2f8] p-4 md:p-8">
      <header className="mx-auto flex max-w-6xl items-center justify-between border-b border-slate-200 pb-5">
        <Link to="/users/login" className="text-xl font-black tracking-tight text-slate-900">Vendora</Link>
        <nav className="flex items-center gap-4 text-sm text-slate-600"><Link to="/users/login" className="hover:text-[#2d80d8]">Login</Link><span className="font-medium text-[#2d80d8]">Registration</span></nav>
      </header>

      <section className="mx-auto max-w-2xl py-8">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Seller registration</div>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Register your shop</h1>
          <p className="mt-2 text-sm text-slate-500">Submit your shop details for seller approval.</p>

          <form id="reg-form" onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">Full Name<input required name="name" placeholder="Full Name" value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-[#2d80d8]" /></label>
            <label className="block text-sm font-medium text-slate-700">Shop Name<input required name="shopName" placeholder="Shop Name" value={shopName} onChange={(event) => setShopName(event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-[#2d80d8]" /></label>
            <label className="block text-sm font-medium text-slate-700 md:col-span-2">Shop Address<input required name="shopAddress" placeholder="Shop Address" value={shopAddress} onChange={(event) => setShopAddress(event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-[#2d80d8]" /></label>
            <label className="block text-sm font-medium text-slate-700">Phone<input name="phone" type="tel" placeholder="201-555-0123" value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-[#2d80d8]" /></label>
            <label className="block text-sm font-medium text-slate-700">Country code<select name="country_code" value={countryCode} onChange={(event) => setCountryCode(event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"><option value="1">+1</option><option value="86">+86</option><option value="81">+81</option><option value="82">+82</option><option value="91">+91</option><option value="60">+60</option><option value="66">+66</option><option value="62">+62</option></select></label>
            <label className="block text-sm font-medium text-slate-700">Password<input required name="password" type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-[#2d80d8]" /></label>
            <label className="block text-sm font-medium text-slate-700">Confirm Password<input required name="password_confirmation" type="password" placeholder="Confirm Password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-[#2d80d8]" /></label>
            <label className="flex items-start gap-2 text-sm text-slate-600 md:col-span-2"><input required name="checkbox_example_1" type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} className="mt-1" />By signing up you agree to our terms and conditions.</label>
            {error ? <div role="alert" className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700 md:col-span-2">{error}</div> : null}
            {message ? <div role="status" className="rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 md:col-span-2">{message} <button type="button" onClick={() => navigate('/users/login')} className="font-semibold underline">Go to login</button></div> : null}
            <button type="submit" disabled={loading} className="rounded-md bg-[#2d80d8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1a6bbf] disabled:opacity-50 md:col-span-2">{loading ? 'Registering...' : 'Create Account'}</button>
          </form>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl border-t border-slate-200 pt-5 text-center text-xs text-slate-500">Terms & conditions · Return Policy · Support Policy · Privacy Policy</footer>
    </main>
  )
}
