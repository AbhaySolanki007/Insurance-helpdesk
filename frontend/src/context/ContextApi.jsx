import { createContext, useState } from "react";

export const Context = createContext();

const ContextProvider = ({ children }) => {
  const [toggle, setToggle] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [onChat, setOnChat] = useState(false);
  const [dataForEmail, setDataForEmail] = useState({});

  return (
    <Context value={{ toggle, setToggle, isDarkTheme, setIsDarkTheme, onChat, setOnChat, dataForEmail, setDataForEmail }}>
      {children}
    </Context>
  );
};
export default ContextProvider;
