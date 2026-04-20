import BookContent from './BookContent.js';
import Book from './Book.js';
import Author from './Author.js';
import { registerModel } from '../../src/index.js';

registerModel("Author", Author);
registerModel("Book", Book);
registerModel("BookContent", BookContent);