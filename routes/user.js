import express from "express";
import {
  getDob,
  getProfileInitialData,
  updatePersonalInfo,
} from "../controllers/users.js";

const router = express.Router();

router.get("/intial", getProfileInitialData);

//todo: get user profile data =>user_id, username, bio, profile picture,cover pic, followers count, following count, count of posts  ,posts, location, website, and contact options

//todo: get user followers
//todo: get user following only if the user id is same as the logged in user
//todo: follow/unfollow a user
//todo: block/unblock a user
//todo: get user blocked list
//todo: edit user profile => name, username, bio and link, profile picture, cover pic, location
router.get("/dob", getDob);
//todo: update user email and/or date of birth
router.post("/updatePersonalInfo", updatePersonalInfo);
//todo: update/forgot user password
//todo: delete user account
//todo: get user liked posts

export default router;
