import express from "express";
import { getSearchSuggestions, searchFeed } from "../controllers/search.js";

const router = express.Router();

//get search query suggestions based on query
router.get("/:query", getSearchSuggestions);
//get search feed based on query
router.get("/hashtag/:hashtag/:from/:to", searchFeed);

export default router;
