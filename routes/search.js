import express from "express";
import { getSearchSuggestions } from "../controllers/search.js";

const router = express.Router();

//get search query suggestions based on query
router.get("/:query", getSearchSuggestions);
//todo: get search results based on hashtag
//todo: follow a hashtag

export default router;
