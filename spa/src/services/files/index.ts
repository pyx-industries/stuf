import { FilesService } from "./filesService";
import apiClient from "../api";

const filesService = new FilesService(apiClient);
export default filesService;
