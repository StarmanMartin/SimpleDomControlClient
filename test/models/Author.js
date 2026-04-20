import {SdcModel, SdcQuerySet} from 'sdc_client';

export default class Author extends SdcModel {


  static fields = {
      "book_set": {
        "type": "ForeignKey",
        "required": false,
        "max_length": null,
        "is_relation": true,
        "many_to_many": false,
        "one_to_many": true,
        "many_to_one": false,
        "one_to_one": false,
        "related_model": "Book",
        "remote_field": "author"
      },
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
      "name": {
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
      "age": {
        "type": "IntegerField",
        "required": true,
        "max_length": null,
        "is_relation": false,
        "many_to_many": null,
        "one_to_many": null,
        "many_to_one": null,
        "one_to_one": null,
        "related_model": null,
        "remote_field": null
      }
    }

  constructor(data = {}) {
    super("Author");
    this._toManyFields = [];
    this._book_set = new SdcQuerySet('Book');
    this._toManyFields.push([this._book_set, 'author']);
    this._id = null;
    this._name = null;
    this._age = null;
    this.setValues(data);
  }

  setValues(data = {}) {
    data.id ??= data.pk ?? null;
    try {
    this.book_set.setFilter({ author:  data.id });
    this.book_set = data.book_set || [];
    } catch {} 
    try {
      this.id = data.id ?? null;
    } catch {} 
    try {
      this.name = data.name ?? null;
    } catch {} 
    try {
      this.age = data.age ?? null;
    } catch {} 
  }

  set book_set(value){
    this.setbook_set(value);
    this._updateForm('book_set');
  }

  set id(value){
    this.setid(value);
    this._updateForm('id');
  }

  set name(value){
    this.setname(value);
    this._updateForm('name');
  }

  set age(value){
    this.setage(value);
    this._updateForm('age');
  }


  setbook_set(value){
    this.validate(value, Author.fields.book_set);
    this._book_set.setIds(this.parseValue(value, Author.fields.book_set));
  }

  setid(value){
    this.validate(value, Author.fields.id);
    this._toManyFields.forEach(([x, fn]) => x.setFilter({[fn]: value}));
    this._id = this.parseValue(value, Author.fields.id);
  }

  setname(value){
    this.validate(value, Author.fields.name);
    this._name = this.parseValue(value, Author.fields.name);
  }

  setage(value){
    this.validate(value, Author.fields.age);
    this._age = this.parseValue(value, Author.fields.age);
  }


  get book_set(){
    return this._book_set;
  }

  get id(){
    return this._id;
  }

  get name(){
    return this._name;
  }

  get age(){
    return this._age;
  }

}