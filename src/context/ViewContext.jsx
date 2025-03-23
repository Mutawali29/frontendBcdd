import { createContext, useContext, useState } from "react";

const ViewContext = createContext();

export const ViewProvider = ({ children }) => {
    const [activeView, setActiveView] = useState("dashboard");

    return (
        <ViewContext.Provider value={{ activeView, setActiveView }}>
            {children}
        </ViewContext.Provider>
    );
};

export const useView = () => useContext(ViewContext);
