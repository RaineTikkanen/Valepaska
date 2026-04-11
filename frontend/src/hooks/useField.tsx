import { useState } from 'react';

const useField = (type: string, placeholder: string) => {
  const [value, setValue] = useState('');

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  return {
    type,
    value,
    onChange,
    placeholder
  };
};

export default useField;