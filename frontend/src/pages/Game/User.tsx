

const User = ({user}:{user:string}) => {
  console.log(user)
  return(
    <div className="flex bg-emerald-400 rounded-4xl py-6 px-2 justify-center">
      <p>{user}</p>
    </div>
  )
}

export default User;