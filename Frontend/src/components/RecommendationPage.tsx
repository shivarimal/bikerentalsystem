import React, { useEffect, useState } from 'react';
import './styles/RecommendationPage.css';
import Footer from './Footer';
import Menubar from './Menubar';
import BikeCardsContainer, { BikeCardProp as Bike } from './BikeCard';
import { getRecommendedBikes } from '../scripts/API Calls/bikeApiCalls';

const RecommendationPage: React.FC = (): JSX.Element => {
    const [recommendedBikes, setRecommendedBikes] = useState<Bike[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        getRecommendedBikes().then((data) => {
            setRecommendedBikes(data);
            setLoading(false);
        });
    }, []);

    return (
        <>
            <Menubar />
            <div className="recommendation-page-container">
                <h2 className="recommendation-page-heading">Recommended for You</h2>
                <p className="recommendation-page-subtitle">
                    Hand-picked bikes just for you based on availability
                </p>
                {loading ? (
                    <div className="recommendation-loading">
                        <div className="spinner-border text-dark" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : recommendedBikes.length > 0 ? (
                    <BikeCardsContainer
                        bikeData={recommendedBikes} />
                ) : (
                    <div className="recommendation-empty">
                        <h4>No recommendations available right now</h4>
                        <p>Check back later for personalized bike suggestions.</p>
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
};

export default RecommendationPage;
