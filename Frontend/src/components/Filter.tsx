import React, { useEffect, useState } from "react";
import { getTypes } from "../scripts/API Calls/bikeApiCalls";
import { FilterData } from "../Types";
import { BRANDS_LIST, CC_LIST, getCCsForBrand } from "../data/bikeOptions";
import SearchableSelect from "./SearchableSelect";

interface FilterProp {
    onChange: (page: number, filterData?: FilterData, searchData?: string) => Promise<void>;
}

const Filter: React.FC<FilterProp> = ({ onChange }): JSX.Element => {
    const [searchData, setSearchData] = useState<string>('');
    const [selectedBrand, setSelectedBrand] = useState<string>('');
    const [selectedCC, setSelectedCC] = useState<number | ''>('');

    const [tags, setTags] = useState<{ brand: string[]; cc: number[]; horsePower?: number[] }>({
        brand: BRANDS_LIST,
        cc: CC_LIST,
        horsePower: [100, 150, 200, 250]
    });

    useEffect(() => {
        getTypes().then((data) => {
            if (data) {
                const apiBrands = Array.isArray(data.brand) && data.brand.length > 0 ? data.brand : BRANDS_LIST;
                const apiCCs = Array.isArray(data.cc) && data.cc.length > 0 ? data.cc : CC_LIST;
                // Merge API unique items with standard lists
                const mergedBrands = Array.from(new Set([...BRANDS_LIST, ...apiBrands]));
                const mergedCCs = Array.from(new Set([...CC_LIST, ...apiCCs])).sort((a, b) => a - b);
                setTags({
                    brand: mergedBrands,
                    cc: mergedCCs,
                    horsePower: data.horsePower || [100, 150, 200, 250]
                });
            }
        });
    }, []);

    useEffect(() => {
        const newFilterData: FilterData = {
            brand: selectedBrand ? [selectedBrand] : [],
            cc: selectedCC !== '' ? [selectedCC] : [],
            horsePower: []
        };
        onChange(1, newFilterData, searchData);
    }, [selectedBrand, selectedCC, searchData]);

    const availableCCs = getCCsForBrand(selectedBrand);

    const handleClearFilters = () => {
        setSelectedBrand('');
        setSelectedCC('');
        setSearchData('');
    };

    return (
        <div className='filter card align-self-start bg-glass bg-mid-white shadow-sm border-0 rounded-3 p-2' style={{ zIndex: 5, width: '100%', maxWidth: '320px' }}>
            <div className='card-body p-3'>
                <h5 className="card-title fw-bold mb-3 d-flex align-items-center justify-content-between">
                    <span>🔍 Find Your Bike</span>
                    {(selectedBrand || selectedCC || searchData) && (
                        <button
                            type="button"
                            className="btn btn-link text-danger p-0 fs-7 text-decoration-none"
                            onClick={handleClearFilters}
                        >
                            Reset All
                        </button>
                    )}
                </h5>

                {/* Search Input */}
                <div className='input-group mb-3'>
                    <input
                        type='text'
                        className='form-control border-dark bg-deep-white shadow-none'
                        placeholder='Search model (e.g. Ninja)'
                        value={searchData}
                        onChange={e => setSearchData(e.target.value)}
                    />
                </div>

                <hr className="my-3 text-muted" />

                {/* Brand Dropdown */}
                <div className="mb-2">
                    <SearchableSelect<string>
                        label="Brand"
                        options={tags.brand}
                        value={selectedBrand}
                        placeholder="All Brands"
                        onChange={(brandVal) => {
                            setSelectedBrand(brandVal === selectedBrand ? '' : brandVal);
                            // If current CC isn't available in new brand, retain or adjust
                        }}
                    />
                </div>

                {/* Engine CC Dropdown */}
                <div className="mb-2">
                    <SearchableSelect<number>
                        label={selectedBrand ? `Engine CC (${selectedBrand})` : "Engine CC"}
                        options={tags.cc}
                        value={selectedCC}
                        placeholder="All CC Options"
                        highlightOptions={availableCCs}
                        formatLabel={(ccVal) => `${ccVal} CC`}
                        onChange={(ccVal) => {
                            setSelectedCC(ccVal === selectedCC ? '' : ccVal);
                        }}
                    />
                </div>

                {/* Active Filter Badges */}
                {(selectedBrand || selectedCC !== '') && (
                    <div className="mt-3 pt-2 border-top">
                        <small className="text-muted d-block mb-1 font-monospace">Active Filters:</small>
                        <div className="d-flex flex-wrap gap-1">
                            {selectedBrand && (
                                <span className="badge bg-primary text-white d-inline-flex align-items-center gap-1">
                                    Brand: {selectedBrand}
                                    <span
                                        className="cursor-pointer ms-1"
                                        onClick={() => setSelectedBrand('')}
                                        style={{ fontSize: '1.1em' }}
                                    >
                                        ×
                                    </span>
                                </span>
                            )}
                            {selectedCC !== '' && (
                                <span className="badge bg-dark text-white d-inline-flex align-items-center gap-1">
                                    CC: {selectedCC} CC
                                    <span
                                        className="cursor-pointer ms-1"
                                        onClick={() => setSelectedCC('')}
                                        style={{ fontSize: '1.1em' }}
                                    >
                                        ×
                                    </span>
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Filter;
