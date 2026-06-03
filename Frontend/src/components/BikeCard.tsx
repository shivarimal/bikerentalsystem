import React, { useEffect, useRef, useState } from 'react';
import Pages from './Pages';
import { returnBikeByBikeId } from '../scripts/API Calls/bookingApiCalls';
import { Bike } from '../Types';
import Model from './Model';

export interface BikeCardProp extends Bike {
    startTime?: Date;
    endTime?: Date;
    showReturnBtn?: boolean;
    onPageChange?: (index: number) => Promise<void>;
}

interface BikeCardsContainerProp {
    bikeData: Bike[];
    heading?: string;
    showReturnBtn?: boolean;
    noOfPages?: number;
    onPageChange?: (index: number) => Promise<void>;
}

export const BikeCardsContainer: React.FC<BikeCardsContainerProp> = ({
    bikeData,
    heading,
    showReturnBtn = false,
    noOfPages,
    onPageChange
}): JSX.Element => {
    return (
        <div className='flex-grow-1 mb-4'>
            {heading ? <h3>{heading}</h3> : ""}
            <div className='bikes-result scroll align-items-start'>
                {
                    bikeData.length === 0 ? <h4>No bikes found</h4> :
                        bikeData.map((bike: BikeCardProp, index: number) => (
                            <BikeCard
                                {...bike}
                                showReturnBtn={showReturnBtn}
                                onPageChange={onPageChange}
                                key={index} />
                        ))
                }
            </div>
            {noOfPages !== undefined && <Pages onPageChange={onPageChange} noOfPages={noOfPages} />}
        </div>
    )
}

const BikeCard: React.FC<BikeCardProp> = ({
    _id,
    bikeModel,
    pricePerHour,
    isAvailable,
    brand,
    cc,
    horsePower,
    type,
    imageURL,
    startTime,
    endTime,
    showReturnBtn = false,
    onPageChange = () => { }
}): React.ReactElement => {
    const [rentalType, setRentalType] = useState<'date' | 'time'>('date');
    const [newStartTime, setStartTime] = useState<Date>(startTime ? new Date(startTime) : new Date());
    const [newEndTime, setEndTime] = useState<Date>(endTime ? new Date(endTime) : new Date());
    const [totalPrice, setTotalPrice] = useState<number>(pricePerHour);
    const closeBtn = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const start = startTime ? new Date(startTime) : new Date();
        const end = endTime ? new Date(endTime) : new Date();
        setStartTime(start);
        setEndTime(end);
    }, [startTime, endTime]);

    useEffect(() => {
        if (rentalType === 'date') {
            const days = Math.ceil((newEndTime.getTime() - newStartTime.getTime()) / (1000 * 60 * 60 * 24));
            setTotalPrice(Math.max(0, days) * pricePerHour * 24);
        } else {
            const startDateTime = new Date(newStartTime);
            const endDateTime = new Date(newEndTime);
            const diffInHours = Math.max(0, Math.ceil((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60)));
            setTotalPrice(diffInHours * pricePerHour);
        }
    }, [newStartTime, newEndTime, pricePerHour, rentalType]);

    // Determine dynamic availability
    const now = new Date();
    const isBookingUpcoming = startTime && new Date(startTime) > now;
    const showAvailable = isAvailable || isBookingUpcoming;

    return (
        <>
            <div
                className='card bg-glass bg-mid-white cursor-pointer'
                data-bs-toggle="modal"
                data-bs-target={"#" + _id}>
                <div className='card-body'>
                    <div className='d-flex'>
                        <div className='flex-grow-1'>
                            <h5 className='card-title'>{bikeModel}</h5>
                            <h6 className='card-subtitle mb-2 text-muted'>{brand}</h6>
                            <p className='card-text'>Price: {pricePerHour}₹<span style={{ fontWeight: 600 }}>/hr</span></p>

                            {/* Availability Display */}
                            <p className={'card-text d-flex align-items-center' + (showAvailable ? " text-success" : " text-danger")}>
                                {showAvailable ? 'Available ' : 'Not Available '}
                                {showAvailable && <img width={15} height={15} className='ms-2' src='tick.svg' alt="tick" />}
                            </p>
                        </div>
                        <div className='d-flex flex-column'>
                            <img
                                src={imageURL ? `http://localhost:5000/bikeImages/${imageURL}` : 'bike.svg'}
                                width={120}
                                height={120}
                                className='my-auto rounded-2'
                                style={{
                                    objectFit: 'cover',
                                    objectPosition: 'center',
                                    backgroundColor: 'rgba(0, 0, 0, 0.1)'
                                }}
                                alt='bike'
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Model heading={bikeModel} id={_id}>
                <div className='modal-body row mx-2' style={{ whiteSpace: 'nowrap' }}>
                    <div className='col'>
                        <p className='m-0'><b>Brand:</b> {brand}</p>
                        <p className='m-0'><b>CC:</b> {cc}</p>
                        <p className='m-0'><b>Horse Power:</b> {horsePower}</p>
                        <p className='m-0'><b>Type:</b> {type}</p>
                        <p className='m-0'><b>Price:</b> {pricePerHour}₹<span style={{ fontWeight: 600 }}>/hr</span></p>

                        {/* Modal Availability Display */}
                        <p className={'d-flex align-items-center' + (showAvailable ? " text-success" : " text-danger")}>
                            {showAvailable ? 'Available ' : 'Not Available '}
                            {showAvailable && <img width={15} height={15} className='ms-2' src='tick.svg' alt="tick" />}
                        </p>
                    </div>
                    <div className='col'>
                        <label htmlFor='rentalType'>Rental Type:</label>
                        <select
                            id='rentalType'
                            className='form-select mt-1 mb-3'
                            value={rentalType}
                            onChange={e => setRentalType(e.target.value as 'date' | 'time')}>
                            <option value='date'>Date-based (Full day)</option>
                            <option value='time'>Time-based (Hourly)</option>
                        </select>

                        <label htmlFor='startDate'>Start Date:</label>
                        <input
                            type='date'
                            id='startDate'
                            className='form-control mt-1'
                            value={newStartTime.toISOString().split('T')[0]}
                            onChange={e => {
                                const newDate = new Date(e.target.value);
                                newDate.setHours(newStartTime.getHours(), newStartTime.getMinutes());
                                setStartTime(newDate);
                                if (newDate > newEndTime) setEndTime(newDate);
                            }} />

                        {rentalType === 'time' && (
                            <>
                                <label htmlFor='startTime' className='mt-2'>Start Time:</label>
                                <input
                                    type='time'
                                    id='startTime'
                                    className='form-control mt-1'
                                    value={newStartTime.toTimeString().slice(0, 5)}
                                    onChange={e => {
                                        const [hours, minutes] = e.target.value.split(':').map(Number);
                                        const updated = new Date(newStartTime);
                                        updated.setHours(hours, minutes);
                                        setStartTime(updated);
                                    }} />
                            </>
                        )}

                        <label htmlFor='returnDate' className='mt-2'>Return Date:</label>
                        <input
                            type='date'
                            id='returnDate'
                            className='form-control mt-1'
                            value={newEndTime.toISOString().split('T')[0]}
                            onChange={e => {
                                const newDate = new Date(e.target.value);
                                newDate.setHours(newEndTime.getHours(), newEndTime.getMinutes());
                                setEndTime(newDate);
                                if (newDate < newStartTime) setStartTime(newDate);
                            }} />

                        {rentalType === 'time' && (
                            <>
                                <label htmlFor='returnTime' className='mt-2'>Return Time:</label>
                                <input
                                    type='time'
                                    id='returnTime'
                                    className='form-control mt-1'
                                    value={newEndTime.toTimeString().slice(0, 5)}
                                    onChange={e => {
                                        const [hours, minutes] = e.target.value.split(':').map(Number);
                                        const updated = new Date(newEndTime);
                                        updated.setHours(hours, minutes);
                                        setEndTime(updated);
                                    }} />
                            </>
                        )}

                        <p className='mt-2'><b>Total Price:</b> ₹{totalPrice}</p>
                    </div>

                    <div className='d-flex flex-column'>
                        <img
                            src={imageURL ? `http://localhost:5000/bikeImages/${imageURL}` : 'bike.svg'}
                            width={240}
                            height={180}
                            className='my-auto rounded-2'
                            style={{
                                objectFit: 'cover',
                                objectPosition: 'center',
                                backgroundColor: 'rgba(0, 0, 0, 0.1)'
                            }}
                            alt='bike'
                        />
                    </div>
                </div>

                <div className="modal-footer mx-auto">
                    <button
                        type="button"
                        className="btn btn-outline-dark border-2 border-dark"
                        data-bs-dismiss="modal"
                        ref={closeBtn}>Close</button>

                    {!showReturnBtn && showAvailable && (
                        <button
                            type="button"
                            className="btn border-2 btn-dark"
                            onClick={async () => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);

                                const startDate = new Date(newStartTime);
                                const endDate = new Date(newEndTime);
                                startDate.setHours(0, 0, 0, 0);
                                endDate.setHours(0, 0, 0, 0);

                                if (startDate < today) {
                                    alert("Booking cannot start in the past. Please select today or a future date.");
                                    return;
                                }

                                if (endDate < today) {
                                    alert("Return date cannot be in the past. Please select today or a future date.");
                                    return;
                                }

                                if (newStartTime > newEndTime) {
                                    alert("Start time cannot be after the end time.");
                                    return;
                                }

                                // Navigate to payment page with bike and booking details
                                closeBtn.current?.click();
                                
                                // Use window.location for navigation with state
                                window.location.href = `/payment?bikeId=${_id}&startTime=${newStartTime.toISOString()}&endTime=${newEndTime.toISOString()}&amount=${totalPrice}`;
                                
                                // Note: We're using window.location here because we need to pass complex state
                                // In a real implementation, you might want to use React Router's navigate with state
                            }}>
                            Book
                        </button>
                    )}

                    {showReturnBtn && (
                        <button
                            className='btn btn-dark border-2 border-dark float-end mt-2'
                            onClick={async () => {
                                await returnBikeByBikeId(_id).then(() => {
                                    closeBtn.current?.click();
                                    onPageChange(1);
                                });
                            }}>
                            Return
                        </button>
                    )}
                </div>
            </Model>
        </>
    );
}

export default BikeCardsContainer;
