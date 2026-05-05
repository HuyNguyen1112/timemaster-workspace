import React, { createContext, useContext, useState, useCallback } from 'react';
import { CustomAlert } from './CustomAlert';

type AlertType = 'info' | 'success' | 'error' | 'warning' | 'notification';

interface AlertOptions {
    title: string;
    message: string;
    type?: AlertType;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
}

interface AlertContextType {
    showAlert: (options: AlertOptions) => void;
    hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [visible, setVisible] = useState(false);
    const [options, setOptions] = useState<AlertOptions>({
        title: '',
        message: '',
        type: 'info',
    });

    const showAlert = useCallback((newOptions: AlertOptions) => {
        setOptions(newOptions);
        setVisible(true);
    }, []);

    const hideAlert = useCallback(() => {
        setVisible(false);
    }, []);

    const handleConfirm = () => {
        if (options.onConfirm) {
            options.onConfirm();
        }
        hideAlert();
    };

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            <CustomAlert
                visible={visible}
                title={options.title}
                message={options.message}
                type={options.type}
                confirmText={options.confirmText}
                cancelText={options.cancelText}
                onClose={hideAlert}
                onConfirm={options.onConfirm ? handleConfirm : undefined}
            />
        </AlertContext.Provider>
    );
};

export const useCustomAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useCustomAlert must be used within an AlertProvider');
    }
    return context;
};
