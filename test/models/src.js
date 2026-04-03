import SdcUser from './SdcUser.js';
import BookContent from './BookContent.js';
import Book from './Book.js';
import Author from './Author.js';
import { registerModel } from 'sdc_client';

registerModel("Author", Author);
registerModel("Book", Book);
registerModel("BookContent", BookContent);
registerModel("SdcUser", SdcUser);