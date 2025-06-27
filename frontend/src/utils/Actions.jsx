import axios, { AxiosError } from "axios";
import { redirect } from "react-router";
import { toast } from "react-toastify";
// import api from "../Config/axios.config";

export const loginAction = async ({ request }) => {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  const isAdmin = formData.has("isAdmin");
  const loginData = { ...data, isAdmin };
  console.log(loginData);
  try {
    const response = await axios.post(
      "http://localhost:8000/api/v1/users/login",
      loginData,
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );
    console.log("response", response);
    const { _id, email, fullname, isAdmin } = response.data.data.user;
    const emailData = localStorage.getItem("emailData");
    let userData = JSON.parse(emailData);
    userData = {
      email,
      username: fullname,
    };
    localStorage.setItem("emailData", JSON.stringify(userData));
    // sessionStorage.setItem("userId", _id);// Store user ID to only allow that particular ID to access the chat
    // console.log("userData", userData);
    console.log("logged-in user ID:", _id);
    if (isAdmin) {
      toast("Admin logged-in successfully :)");
      return redirect(`/admin/${_id}`);
    }
    toast(response.data?.message || "You have logged-in successfully :)");
    return redirect(`/chat/${_id}`);
  } catch (error) {
    console.error("Error::", error);
    if (error instanceof AxiosError) {
      if (error.status === 401) {
        toast.error("Incorrect credentials!");
        throw new Error(error.message);
      }
      if (error.status === 404) {
        toast.error("No such user was found!");
        throw new Error(
          "User with these specific credentials does not exist!!"
        );
      }
    } else if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Something went wrong while logging-in the user");
  }
};

export const registerAction = async ({ request }) => {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  console.log(data);
  try {
    const response = await axios.post(
      "http://localhost:8000/api/v1/users/register",
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Success Response:", response);

    toast("Successfully registered!!");

    const pythonEmailData = {
      email: response.data.data.email,
      username: response.data.data.fullname,
    };
    console.log("pythonEmailData", pythonEmailData);
    localStorage.setItem("emailData", JSON.stringify(pythonEmailData));
    await axios.post("http://127.0.0.1:8000/register", pythonEmailData);
    return redirect("/login");
  } catch (error) {
    console.error("ERROR:--", error);
    if (error.status === 409) {
      toast.error("User with this email already exists!");
      throw new Error("User with this email already exists!");
    }
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error("Something went wrong while registering the user");
    }
  }
};
