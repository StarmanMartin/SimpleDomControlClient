import {SdcModel, SdcQuerySet} from 'sdc_client';

export default class Book extends SdcModel {


  static fields = {
      "id": {
        "type": "BigAutoField",
        "required": false,
        "max_length": null,
        "is_relation": false,
        "many_to_many": null,
        "one_to_many": null,
        "many_to_one": null,
        "one_to_one": null,
        "related_model": null,
        "remote_field": null
      },
      "title": {
        "type": "CharField",
        "required": true,
        "max_length": 255,
        "is_relation": false,
        "many_to_many": null,
        "one_to_many": null,
        "many_to_one": null,
        "one_to_one": null,
        "related_model": null,
        "remote_field": null
      },
      "author": {
        "type": "ForeignKey",
        "required": true,
        "max_length": null,
        "is_relation": true,
        "many_to_many": false,
        "one_to_many": false,
        "many_to_one": true,
        "one_to_one": false,
        "related_model": "Author",
        "remote_field": "book"
      }
    }

  constructor(data = {}) {
    super("Book");
    this._toManyFields = [];
    this._id = null;
    this._title = null;
    this._author = new SdcQuerySet('Author');
    this.setValues(data);
  }

  setValues(data = {}) {
    data.id ??= data.pk ?? null;
    try {
      this.id = data.id ?? null;
    } catch {} 
    try {
      this.title = data.title ?? null;
    } catch {} 
    this.author.filter({ id: data.author });
  }

  set id(value){
    this.validate(value, Book.fields.id);
    this._toManyFields.forEach((x) => x.setFilter({id: value}));
    this._id = this.parseValue(value, Book.fields.id);
  }

  set title(value){
    this.validate(value, Book.fields.title);
    this._title = this.parseValue(value, Book.fields.title);
  }

  set author(value){
    this.validate(value, Book.fields.author);
    this._author.setIds(this.parseValue(value, Book.fields.author));
  }


  get id(){
    return this._id;
  }

  get title(){
    return this._title;
  }

  get author(){
    return this._author.length > 0 ? this._author[0] : this._author.new();
  }

}