

const User = ({user}:{user:string}) => {
  console.log(user);
  return(
    <div className="flex justify-center rounded-4xl bg-emerald-400 px-2 py-6">
      <p>{user}</p>
    </div>
  );
};

export default User;