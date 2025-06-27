import { Link } from "react-router";

const Error = () => {
  return (
    <div className="h-screen grid place-items-center bg-gradient-to-r from-[#7F7FD5] via-[#86A8E7] to-[#91EAE4]">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white">404</h1>
        <p className="mt-4 text-lg text-white">Page Not Found</p>
        <Link
          to="/"
          className="mt-8 inline-block px-4 py-2 bg-blue-500 text-white rounded"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
};
export default Error;
