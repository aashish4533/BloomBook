/**
 * Maps exported kit assets to the sections shown on the master kit_reference sheet.
 * Asset files live in /public/brand/.
 */
const BRAND_BASE = '/brand';

export function BrandKitReference() {
  return (
    <div className="min-h-screen bg-stone-100 text-[#2C3E50]">
      <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14 space-y-12">
        <header className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#1e3a5f]">BookBloom logo kit</h1>
          <p className="text-sm sm:text-base text-stone-600 max-w-2xl">
            Master reference below, followed by each exported asset in its designated role (navbar, social, email, dark header, badges).
          </p>
        </header>

        <section className="space-y-3" aria-labelledby="kit-master">
          <h2 id="kit-master" className="text-lg font-semibold">
            Kit reference (full sheet)
          </h2>
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm overflow-hidden">
            <img
              src={`${BRAND_BASE}/kit-reference.png`}
              alt="BookBloom complete logo kit reference"
              className="w-full h-auto object-contain"
              width={1200}
              height={700}
            />
          </div>
        </section>

        <section className="space-y-3" aria-labelledby="s1">
          <h2 id="s1" className="text-lg font-semibold">
            1. Navbar logo (transparent background)
          </h2>
          <p className="text-sm text-stone-600">Use on light backgrounds or over imagery.</p>
          <div className="rounded-xl border border-stone-200 bg-white p-6 flex justify-start">
            <img
              src={`${BRAND_BASE}/navbar-transparent.png`}
              alt="BookBloom navbar logo transparent"
              className="max-h-14 w-auto object-contain"
            />
          </div>
        </section>

        <section className="space-y-3" aria-labelledby="s2">
          <h2 id="s2" className="text-lg font-semibold">
            2. Navbar logo (golden bar — matches live header)
          </h2>
          <p className="text-sm text-stone-600">Used in the site header.</p>
          <div className="rounded-xl border border-stone-200 bg-[#C4A672] p-6 flex justify-start">
            <img
              src={`${BRAND_BASE}/navbar-golden.png`}
              alt="BookBloom navbar logo on gold"
              className="max-h-14 w-auto object-contain"
            />
          </div>
        </section>

        <section className="space-y-3" aria-labelledby="s3">
          <h2 id="s3" className="text-lg font-semibold">
            3. Square share card & circular badge
          </h2>
          <p className="text-sm text-stone-600">Open Graph / previews and profile-style ring artwork.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-2">
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">OG / square (05)</p>
              <img
                src={`${BRAND_BASE}/og-square.png`}
                alt="BookBloom square social preview"
                className="w-full max-w-xs mx-auto rounded-lg object-contain"
              />
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-2 flex flex-col items-center">
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Circular badge (08)</p>
              <img
                src={`${BRAND_BASE}/circular-badge.png`}
                alt="BookBloom circular badge"
                className="w-48 h-48 object-contain"
              />
            </div>
          </div>
        </section>

        <section className="space-y-3" aria-labelledby="s4">
          <h2 id="s4" className="text-lg font-semibold">
            4. Social media banner (04)
          </h2>
          <div className="rounded-xl border border-stone-200 bg-white p-4 overflow-x-auto">
            <img
              src={`${BRAND_BASE}/social-banner.png`}
              alt="BookBloom social header banner"
              className="min-w-[600px] w-full h-auto object-contain"
            />
          </div>
        </section>

        <section className="space-y-3" aria-labelledby="s5">
          <h2 id="s5" className="text-lg font-semibold">
            5. Email header (06)
          </h2>
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
            <img
              src={`${BRAND_BASE}/email-header.png`}
              alt="BookBloom email header"
              className="w-full h-auto object-contain max-h-32"
            />
          </div>
        </section>

        <section className="space-y-3" aria-labelledby="s6">
          <h2 id="s6" className="text-lg font-semibold">
            6. Dark-mode header (07)
          </h2>
          <div className="rounded-xl border border-stone-700 bg-[#0f172a] p-6">
            <img
              src={`${BRAND_BASE}/dark-mode-banner.png`}
              alt="BookBloom dark mode header"
              className="w-full h-auto object-contain max-h-24"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
