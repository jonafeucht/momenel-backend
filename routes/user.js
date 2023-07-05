import express from "express";
import {
  checkUsername,
  deleteAccount,
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
router.post("/editprofile", upload.single("profile"), updateEditProfile);
router.get("/profile/:username/:from/:to", getProfile);
router.get("/dob", getDob);
router.post("/updatePersonalInfo", updatePersonalInfo);
router.delete("/delete", deleteAccount);

export default router;
