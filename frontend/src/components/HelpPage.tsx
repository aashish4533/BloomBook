import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card } from './ui/card';

export function HelpPage() {
    const navigate = useNavigate();
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const faqs = [
        {
            question: "How do I rent a book?",
            answer: "Navigate to the Marketplace, use the 'Rent' filter, and select a book. Choose your rental duration (Weekly, Monthly, Yearly) and proceed to checkout."
        },
        {
            question: "Can I sell my own books?",
            answer: "Yes! Go to the 'Sell' section, upload photos of your book, set a price, and publish your listing. You can also offer books for Rent or Exchange."
        },
        {
            question: "How does the Tuition Hub work?",
            answer: "The Tuition Hub connects students with verify tutors. You can browse tutor profiles, view their specializations, and book sessions directly through the platform."
        },
        {
            question: "Is there a delivery service?",
            answer: "Yes, we offer integrated delivery tracking. Once you make a purchase or rental, you can track the status of your book delivery in the Dashboard."
        },
        {
            question: "What is the 'Bloom' community?",
            answer: "BookBloom Communities are groups where you can discuss books, share recommendations, and chat with other members who share your interests."
        }
    ];

    return (
        <div className="min-h-screen bg-[#FAF8F3] p-8 md:p-12 pb-24">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-600 mb-6 hover:text-[#C4A672] transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Home
                </button>

                <h1 className="text-4xl font-bold text-[#2C3E50] mb-2">Help Center</h1>
                <p className="text-gray-600 mb-8">Frequently asked questions and support guides.</p>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <Card
                            key={index}
                            className={`overflow-hidden transition-all duration-200 border-l-4 ${openIndex === index ? 'border-l-[#C4A672] shadow-md' : 'border-l-transparent'}`}
                        >
                            <button
                                className="w-full text-left p-6 flex items-center justify-between"
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            >
                                <span className="font-semibold text-[#2C3E50] text-lg">{faq.question}</span>
                                {openIndex === index ? (
                                    <ChevronUp className="w-5 h-5 text-[#C4A672]" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                )}
                            </button>
                            {openIndex === index && (
                                <div className="px-6 pb-6 text-gray-600 animate-in fade-in slide-in-from-top-2">
                                    {faq.answer}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>

                <div className="mt-12 p-8 bg-[#2C3E50] rounded-2xl text-white text-center">
                    <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
                    <p className="text-white/80 mb-6">Our support team is always ready to help you.</p>
                    <Button
                        onClick={() => navigate('/contact')}
                        className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
                    >
                        Contact Support
                    </Button>
                </div>
            </div>
        </div>
    );
}
