
import React from 'react';
import { sipalBlue, sipalTeal } from '../../constants/app-constants';

export const SipalLogo = ({ width = 120 }) => (
    <svg width={width} viewBox="0 0 258.42 55.42" xmlns="http://www.w3.org/2000/svg">
        <style>
            {`.sipal-text{font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 50px; fill: ${sipalBlue};}
            .sipal-icon{fill: ${sipalTeal};}`}
        </style>
        <text className="sipal-text" x="0" y="45">SIPAL</text>
        <path className="sipal-icon" d="M258.42,24.28c0-11.45-8.23-21.24-19.1-23.45a27.18,27.18,0,0,0-10.15-.83c-15.1,0-27.34,12.24-27.34,27.34,0,12.78,8.79,23.51,20.59,26.54,4.25,1.09,8.71.9,12.83-.55,10.11-3.56,17-12.8,17.16-23.4.11-7.79-3.32-14.86-9-19.45-3.37-2.73-7.3-4.32-11.45-4.57-7.24-.43-14,3.48-17.72,9.52-.94,1.54-3.1,1.9-4.64.94s-1.9-3.1-.94-4.64c4.7-7.66,12.85-12.24,21.6-11.75,5.19.29,10,2.23,14.15,5.55,6.58,5.32,10.66,13.4,10.54,22.29-.19,12.91-8.8,24.26-21.2,28.48-5.11,1.74-10.57,2-15.86,.72C210.82,49.52,200,38.2,200,27.34c0-12.91,8.8-24.26,21.2-28.48,5.11-1.74,10.57,2,15.86,.72,7.39,1.78,13.63,6.88,17.2,13.59.9,1.7,3.22,2.24,4.92,1.34s2.24-3.22,1.34-4.92C254.1,1.52,246.33-2.16,238.16.89c-5.8,2.15-10.6,6.33-13.8,11.5-2.25,3.63-3.48,7.84-3.53,12.19-.08,8.12,3.8,15.5,10.1,20,4.25,3.02,9.3,4.42,14.41,3.87,8.23-.9,15.1-6.55,17.61-14.17A24.51,24.51,0,0,0,258.42,24.28Z"/>
    </svg>
);

export const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
);

export const ShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
        <polyline points="16 6 12 2 8 6"></polyline>
        <line x1="12" y1="2" x2="12" y2="15"></line>
    </svg>
);

export const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
);

export const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
);

export const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

export const UploadIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-upload-cloud">
        <polyline points="16 16 12 12 8 16"></polyline>
        <line x1="12" y1="12" x2="12" y2="21"></line>
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
        <polyline points="16 16 12 12 8 16"></polyline>
    </svg>
);

export const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

export const HelpIcon = () => (
    <span className="help-icon">?</span>
);

export const ExpandIcon = ({ isExpanded }: { isExpanded: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease-in-out' }}>
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

export const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

export const AlertIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
);

export const BlockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
    </svg>
);
