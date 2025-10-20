import { CollectionsService } from "./collectionsService";
import apiClient from "../api";

const collectionsService = new CollectionsService(apiClient);
export default collectionsService;
