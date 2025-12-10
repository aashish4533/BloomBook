import { ArrowLeft, Mail, Phone, MapPin, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';

export function ContactPage() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate submission
        setTimeout(() => {
            toast.success("Message sent successfully! We'll get back to you soon.");
            setIsSubmitting(false);
            navigate('/');
        }, 1500);
    };

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

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Contact Info */}
                    <div>
                        <h1 className="text-4xl font-bold text-[#2C3E50] mb-4">Contact Us</h1>
                        <p className="text-gray-600 mb-8">
                            Have questions or suggestions? We'd love to hear from you. Reach out to the BookBloom team.
                        </p>

                        <div className="space-y-6">
                            <Card className="p-6 border-l-4 border-l-[#C4A672]">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-[#C4A672]/10 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-5 h-5 text-[#C4A672]" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[#2C3E50]">Email Us</h3>
                                        <p className="text-sm text-gray-600">support@bookbloom.com</p>
                                        <p className="text-sm text-gray-600">partners@bookbloom.com</p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6 border-l-4 border-l-[#C4A672]">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-[#C4A672]/10 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Phone className="w-5 h-5 text-[#C4A672]" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[#2C3E50]">Call Us</h3>
                                        <p className="text-sm text-gray-600">+92 300 1234567</p>
                                        <p className="text-xs text-gray-500">Mon-Fri, 9am - 6pm</p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6 border-l-4 border-l-[#C4A672]">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-[#C4A672]/10 rounded-full flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-5 h-5 text-[#C4A672]" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[#2C3E50]">Visit Us</h3>
                                        <p className="text-sm text-gray-600">123 Knowledge Avenue,</p>
                                        <p className="text-sm text-gray-600">Education City, Lahore</p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <Card className="p-8">
                        <h2 className="text-2xl font-semibold text-[#2C3E50] mb-6">Send Message</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-gray-700">Name</label>
                                <Input placeholder="Your Name" required />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-gray-700">Email</label>
                                <Input type="email" placeholder="your@email.com" required />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-gray-700">Subject</label>
                                <Input placeholder="How can we help?" required />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-gray-700">Message</label>
                                <Textarea placeholder="Type your message here..." className="min-h-[150px]" required />
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-[#C4A672] hover:bg-[#8B7355] text-white gap-2"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Sending...' : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Send Message
                                    </>
                                )}
                            </Button>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
}
