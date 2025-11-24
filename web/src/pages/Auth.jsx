import React from 'react';
import Login from './Login';
import RegisterParqueadero from './RegisterParqueadero';

export default function Auth() {
    return (
        <div style={{ display: 'flex', gap: 20, padding: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 320px', minWidth: 300, maxWidth: 520 }}>
                <Login />
            </div>
            <div style={{ flex: '1 1 320px', minWidth: 300, maxWidth: 520, borderLeft: '1px solid #eee', paddingLeft: 20 }}>
                <RegisterParqueadero />
            </div>
        </div>
    );
}
