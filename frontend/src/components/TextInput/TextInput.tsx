
interface TextInputProps {
  type: string
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  placeholder: string
  maxLength?: number
  minLength?: number
}

const TextInput = (props: TextInputProps) =>{
  return(
    <input
      maxLength={props.maxLength}
      minLength={props.minLength}
      className="mb-4 rounded bg-emerald-50 px-8 pt-6 pb-8 shadow-md"
      {...props}
    />
  );
};

export default TextInput;