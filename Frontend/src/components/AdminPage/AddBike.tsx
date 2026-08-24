import React, { useState } from 'react';
import { createBike } from '../../scripts/API Calls/bikeApiCalls';
import Model from '../Model';
import { Bike } from '../../Types';
import { predictPrice } from '../../scripts/API Calls/algorithmApiCalls';
import { BRANDS_LIST, CC_LIST, BRAND_CC_MAP, getCCsForBrand } from '../../data/bikeOptions';
import SearchableSelect from '../SearchableSelect';

const AddBike: React.FC = (): JSX.Element => {
    function onSubmitHandler(bikeData: BikeDetailsInput) {
        const formData = new FormData();

        // Append JSON data
        formData.append('bikeModel', bikeData.bikeModel || '');
        formData.append('pricePerHour', bikeData.pricePerHour?.toString() || '');
        formData.append('isAvailable', bikeData.isAvailable ? 'true' : 'false');
        formData.append('brand', bikeData.brand || '');
        formData.append('cc', bikeData.cc?.toString() || '');
        formData.append('horsePower', bikeData.horsePower?.toString() || '');
        formData.append('type', bikeData.type || '');
        // Append file
        if (bikeData.image instanceof File) {
            formData.append('image', bikeData.image, bikeData.image.name);
        }
        createBike(formData).then(() => {
            alert("Bike Added Successfully");
        });
    }

    return (
        <>
            <button
                className='btn bg-glass bg-deep-white p-3 mt-auto position-fixed end-0 bottom-0 m-4 me-5'
                style={{ lineHeight: 1, zIndex: 15 }}
                data-bs-toggle="modal"
                data-bs-target={"#addBikeModel"}>
                <div className='btn-close' style={{ transform: 'rotate(45deg)' }}></div>
            </button>
            <BikeDetailsModel
                heading="ADD BIKE"
                id="addBikeModel"
                bikeDetails={{ _id: "", bikeModel: "", pricePerHour: 0, isAvailable: true, brand: "", cc: 0, horsePower: 0, type: "", imageURL: "" }}
                onSubmit={onSubmitHandler} />
        </>
    );
};

export type BikeDetailsInput = Bike & {
    image: File | null;
};

interface BikeDetailsModelProps {
    heading?: string;
    id: string;
    bikeDetails: Bike;
    onSubmit?: (bikeData: BikeDetailsInput) => void;
    submitBtnLabel?: string;
}

export const BikeDetailsModel: React.FC<BikeDetailsModelProps> = ({ heading = "Bike Model", id, bikeDetails, onSubmit = () => { }, submitBtnLabel = "SUBMIT" }): JSX.Element => {
    const [bikeData, setBikeData] = useState<BikeDetailsInput>({
        _id: bikeDetails._id || "",
        bikeModel: bikeDetails.bikeModel || "",
        pricePerHour: bikeDetails.pricePerHour || 0,
        isAvailable: bikeDetails.isAvailable || true,
        brand: bikeDetails.brand || "",
        cc: bikeDetails.cc || 0,
        horsePower: bikeDetails.horsePower || 0,
        type: bikeDetails.type || "",
        imageURL: bikeDetails.imageURL || "",
        image: null
    });
    const [imagePreview, setImagePreview] = useState<string | ArrayBuffer | null>(bikeDetails.imageURL || 'bike.svg');
    const [isPredicting, setIsPredicting] = useState<boolean>(false);

    const availableCCsForSelectedBrand = getCCsForBrand(bikeData.brand);

    const handleAutoPredict = async () => {
        if (!bikeData.cc || !bikeData.horsePower) {
            alert('Please specify the CC and Horse Power of the bike first to predict price.');
            return;
        }

        setIsPredicting(true);
        try {
            const data = await predictPrice(bikeData.cc, bikeData.horsePower);
            if (data && data.predictedPrice) {
                setBikeData(prev => ({ ...prev, pricePerHour: data.predictedPrice }));
            }
        } catch (error: any) {
            alert(error.message || 'Failed to predict price. Make sure the AI algorithm is running and trained.');
        } finally {
            setIsPredicting(false);
        }
    };

    const handleBikeDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        const files = (e.target as HTMLInputElement).files;

        setBikeData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : (type === 'file' ? files?.[0] : value)
        }));

        if (type === 'file') {
            const selectedFile = files?.[0];
            if (selectedFile) {
                const reader = new FileReader();
                reader.onload = () => {
                    setImagePreview(reader.result);
                };
                reader.readAsDataURL(selectedFile);
            }
        }
    };

    return (
        <Model heading={heading} id={id}>
            <div className='modal-body form d-flex flex-column px-5'>
                {bikeData._id && <label className='form-label mb-2'>
                    <span className="fw-semibold small text-muted">Bike ID</span>
                    <input className='m-0 form-control' name="_id" value={bikeData._id} disabled readOnly placeholder="Bike ID" />
                </label>}
                <label className='form-label mb-2'>
                    <span className="fw-semibold small text-muted">Bike Model</span>
                    <input type='text' className='m-0 form-control' name="bikeModel" value={bikeData.bikeModel} onChange={handleBikeDataChange} placeholder="e.g. Continental GT 650" />
                </label>

                {/* Brand Dropdown */}
                <SearchableSelect
                    label="Brand"
                    options={BRANDS_LIST}
                    value={bikeData.brand}
                    placeholder="Select Brand..."
                    onChange={(selectedBrand) => {
                        setBikeData(prev => ({
                            ...prev,
                            brand: selectedBrand,
                            // If current CC is not valid for new brand, reset or retain if valid
                            cc: BRAND_CC_MAP[selectedBrand] && !BRAND_CC_MAP[selectedBrand].includes(prev.cc)
                                ? BRAND_CC_MAP[selectedBrand][0]
                                : prev.cc
                        }));
                    }}
                />

                {/* CC Dropdown (Filtered by selected Brand) */}
                <SearchableSelect
                    label={bikeData.brand ? `Engine CC (${bikeData.brand} Models)` : "Engine CC"}
                    options={CC_LIST}
                    value={bikeData.cc || ''}
                    placeholder="Select Engine CC..."
                    highlightOptions={availableCCsForSelectedBrand}
                    formatLabel={(ccVal) => `${ccVal} CC`}
                    onChange={(selectedCC) => {
                        setBikeData(prev => ({
                            ...prev,
                            cc: selectedCC
                        }));
                    }}
                />

                <label className='form-label d-flex align-items-center gap-2 m-0 mb-3'>
                    <div className="flex-grow-1">
                        <span className="fw-semibold small text-muted">Price (Rs./hr)</span>
                        <input type='text' className='m-0 form-control' name="pricePerHour" value={bikeData.pricePerHour} onChange={handleBikeDataChange} placeholder="Price (Rs./hr)" />
                    </div>
                    <div className="align-self-end">
                        <button type="button" className='btn btn-warning btn-sm whitespace-nowrap' onClick={handleAutoPredict} disabled={isPredicting}>
                            {isPredicting ? 'Predicting...' : '✨ AI Predict'}
                        </button>
                    </div>
                </label>

                <div className="form-check d-flex align-items-center ps-1 mb-3">
                    <label className="form-check-label me-2 fw-semibold small" htmlFor='isAvailable'>Is Available</label>
                    <input className='m-0 form-check-input' id='isAvailable' name="isAvailable" type='checkbox' checked={bikeData.isAvailable} onChange={handleBikeDataChange} />
                </div>

                <label className='form-label mb-2'>
                    <span className="fw-semibold small text-muted">Horse Power</span>
                    <input type='number' className='m-0 form-control' name="horsePower" value={bikeData.horsePower} onChange={handleBikeDataChange} placeholder="Horse Power (e.g. 47)" />
                </label>

                <label className='form-label mb-3'>
                    <span className="fw-semibold small text-muted">Type / Category</span>
                    <input className='m-0 form-control' name="type" value={bikeData.type} onChange={handleBikeDataChange} placeholder="e.g. Cruiser / Sports / Naked" />
                </label>

                <label className='form-label d-flex justify-content-center flex-column align-items-center'>
                    <span className="fw-semibold small text-muted mb-1 w-100 text-start">Bike Image</span>
                    <input type='file' name='image' accept='image/*' className='m-0' style={{ display: 'none' }} id={`image-upload-${id}`} onChange={handleBikeDataChange}></input>
                    <label htmlFor={`image-upload-${id}`} className="w-100 cursor-pointer text-center">
                        <img
                            style={{ background: `rgba(0, 0, 0, 0.1)`, objectFit: 'cover', objectPosition: 'center', height: '180px' }}
                            src={imagePreview ? (imagePreview as string) : 'bike.svg'}
                            className='rounded w-100 border'></img>
                        <small className="text-primary mt-1 d-block">Click image to change file</small>
                    </label>
                </label>
            </div>
            <div className="modal-footer mx-auto">
                <button
                    type="button"
                    className="btn btn-outline-dark border-2 border-dark"
                    data-bs-dismiss="modal"
                >Close</button>
                <button type="button" className="btn btn-outline-dark border-2" onClick={() => {
                    setBikeData({
                        _id: bikeDetails._id,
                        bikeModel: "",
                        pricePerHour: 0,
                        isAvailable: true,
                        brand: "",
                        cc: 0,
                        horsePower: 0,
                        type: "",
                        imageURL: "",
                        image: null
                    });
                    setImagePreview('bike.svg');
                }}>Clear</button>
                <button type="button" className="btn border-2 btn-dark" onClick={e => {
                    e.preventDefault();
                    if (!bikeData.bikeModel || !bikeData.pricePerHour || !bikeData.brand || !bikeData.cc || !bikeData.horsePower || !bikeData.type) {
                        alert("Please fill in all the required fields");
                        return;
                    }
                    onSubmit(bikeData);
                }}>{submitBtnLabel}</button>
            </div>
        </Model>
    );
};

export default AddBike;