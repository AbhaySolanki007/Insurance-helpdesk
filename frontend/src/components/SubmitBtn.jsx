import { useNavigation } from "react-router";

const SubmitBtn = ({ text }) => {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <button
      type="submit"
      className={`btn btn-primary btn-block capitalize transition-all text-base text-slate-100 font-semibold border-neutral-300 ${
        isSubmitting
          ? "cursor-not-allowed opacity-75"
          : "hover:scale-105 hover:bg-lime-500 hover:text-white"
      }`}
      disabled={isSubmitting}
    >
      {isSubmitting ? (
        <>
          <span className="loading loading-ring loading-md"></span>
          Logging-in...
        </>
      ) : (
        text || "Submit"
      )}
    </button>
  );
};
export default SubmitBtn;
