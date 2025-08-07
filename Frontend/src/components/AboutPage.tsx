import React from 'react';
import Menubar from './Menubar';

const AboutPage: React.FC = (): JSX.Element => {
    return (
        <div className="container-fluid p-0">
            <Menubar />
            <div className="container mt-5 p-4 bg-light rounded shadow">
                <h1 className="text-center mb-4">About Us</h1>
                <div className="row">
                    <div className="col-md-8 mx-auto">
                        <p className="lead text-muted">
                            Welcome to our Bike Rental System! We are passionate about providing high-quality bikes
                            for your riding needs. Whether you're looking for a casual ride around the city or an
                            adventure on mountain trails, we have the perfect bike for you.
                        </p>
                        <h3 className="mt-4">Our Mission</h3>
                        <p>
                            To provide accessible, affordable, and environmentally friendly transportation options
                            while promoting a healthy lifestyle through cycling.
                        </p>
                        <h3 className="mt-4">Why Choose Us?</h3>
                        <ul className="list-group list-group-flush">
                            <li className="list-group-item">Wide selection of well-maintained bikes</li>
                            <li className="list-group-item">Competitive hourly rates</li>
                            <li className="list-group-item">Flexible rental durations</li>
                            <li className="list-group-item">Excellent customer service</li>
                            <li className="list-group-item">Easy booking process</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;