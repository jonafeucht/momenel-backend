import express from "express";
import {
  checkUsername,
  getDob,
  getEditProfileData,
  getProfile,
  getProfileInitialData,
  updateEditProfile,
  updateHasOnboarded,
  updateName,
  updatePersonalInfo,
  updateUsername,
} from "../controllers/users.js";
import multer from "multer";

const router = express.Router();
const upload = multer(); //multer options

router.get("/intial", getProfileInitialData);
router.get("/checkUsername/:username", checkUsername);
router.post("/username/:username", updateUsername);
router.post("/name/:name", updateName);
router.post("/hasOnboarded", updateHasOnboarded);
router.get("/editprofile", getEditProfileData);
router.post("/editprofile", upload.array("profile"), updateEditProfile);
router.get("/profile/:username/:from/:to", getProfile);
//todo: get user followers
//todo: get user following only if the user id is same as the logged in user
router.get("/dob", getDob);
router.post("/updatePersonalInfo", updatePersonalInfo);
//todo: delete user account

export default router;
