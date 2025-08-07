import React, { useState } from 'react';
import Menubar from './Menubar';

const ContactPage: React.FC = (): JSX.Element => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
        alert('Thank you for your message! We will get back to you soon.');
        setFormData({ name: '', email: '', message: '' });
    };

    return (
        <div className="container-fluid p-0">
            <Menubar />
            <main className="container mt-5 p-4 bg-light rounded shadow">
                <h1 className="text-center mb-4">Contact Us</h1>
                <div className="row">
                    {/* Contact Form */}
                    <div className="col-md-6">
                        <form onSubmit={handleSubmit} noValidate>
                            <div className="mb-3">
                                <label htmlFor="name" className="form-label">Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter your full name"
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="email" className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="yourname@example.com"
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="message" className="form-label">Message</label>
                                <textarea
                                    className="form-control"
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    rows={5}
                                    required
                                    placeholder="Your message..."
                                />
                            </div>
                            <button type="submit" className="btn btn-primary w-100">Send Message</button>
                        </form>
                    </div>

                    {/* Contact Info */}
                    <div className="col-md-6 mt-4 mt-md-0">
                        <div className="card h-100">
                            <div className="card-body">
                                <h3 className="card-title mb-3">Get In Touch </h3>
                                <p className="card-text">
                                    Need help with rentals, pricing, or bookings? We're here for you — reach out anytime!
                                </p>
                                <ul className="list-unstyled">
                                    <li className="mb-2 d-flex align-items-start">
                                        <i className="bi bi-geo-alt me-2" aria-hidden="true"></i>
                                        <span>Tinkune, Kathmandu City, Nepal</span>
                                    </li>
                                    <li className="mb-2 d-flex align-items-start">
                                        <i className="bi bi-telephone me-2" aria-hidden="true"></i>
                                        <span>(977) 123-4567</span>
                                    </li>
                                    <li className="mb-2 d-flex align-items-start">
                                        <i className="bi bi-envelope me-2" aria-hidden="true"></i>
                                        <span>info@bikerentalnepal.com</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ContactPage;
