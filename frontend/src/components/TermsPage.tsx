import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from './ui/card';

export function TermsPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#FAF8F3] p-8 md:p-12 pb-24">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-600 mb-6 hover:text-[#C4A672] transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Home
                </button>

                <h1 className="text-4xl font-bold text-[#2C3E50] mb-8">Terms of Service</h1>

                <Card className="p-8 space-y-6 text-gray-700">
                    <section>
                        <h2 className="text-xl font-semibold text-[#2C3E50] mb-3">1. Acceptance of Terms</h2>
                        <p className="leading-relaxed">
                            By accessing and using BookBloom, you accept and agree to be bound by the terms and provision of this agreement.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[#2C3E50] mb-3">2. Description of Service</h2>
                        <p className="leading-relaxed">
                            BookBloom is a platform that allows users to buy, sell, rent, and exchange books, as well as access educational resources like tuition and notes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[#2C3E50] mb-3">3. User Conduct</h2>
                        <p className="leading-relaxed">
                            All interactions on the platform must be respectful. Listing illegal or offensive content, harassment of other users, and fraudulent activities are strictly prohibited.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[#2C3E50] mb-3">4. Buying and Selling</h2>
                        <p className="leading-relaxed">
                            Users are responsible for the accuracy of their listings. BookBloom is not responsible for the condition of items traded between users, though we facilitate dispute resolution.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[#2C3E50] mb-3">5. Privacy Policy</h2>
                        <p className="leading-relaxed">
                            Your privacy is important to us. Data collected is used solely for improving your experience on BookBloom and is protected according to industry standards.
                        </p>
                    </section>

                    <div className="pt-8 border-t border-gray-100">
                        <p className="text-sm text-gray-500">Last updated: December 2025</p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
