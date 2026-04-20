import {SdcModel, SdcQuerySet} from 'sdc_client';

export default class BookContent extends SdcModel {


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
      "user": {
        "type": "ForeignKey",
        "required": false,
        "max_length": null,
        "is_relation": true,
        "many_to_many": false,
        "one_to_many": false,
        "many_to_one": true,
        "one_to_one": false,
        "related_model": "SdcUser",
        "remote_field": "bookcontent"
      },
      "text": {
        "type": "FileField",
        "required": true,
        "max_length": 100,
        "is_relation": false,
        "many_to_many": null,
        "one_to_many": null,
        "many_to_one": null,
        "one_to_one": null,
        "related_model": null,
        "remote_field": null,
        "max_size": 5368709120,
        "allowed_types": null
      }
    }

  constructor(data = {}) {
    super("BookContent");
    this._toManyFields = [];
    this._id = null;
    this._user = new SdcQuerySet('SdcUser');
    this._text = null;
    this.setValues(data);
  }

  setValues(data = {}) {
    data.id ??= data.pk ?? null;
    try {
      this.id = data.id ?? null;
    } catch {} 
    try {
      if (data.user) { this.user = data.user; }
    } catch {} 
    try {
      this.text = data.text ?? null;
    } catch {} 
  }

  set id(value){
    this.setid(value);
    this._updateForm('id');
  }

  set user(value){
    this.setuser(value);
    this._updateForm('user');
  }

  set text(value){
    this.settext(value);
    this._updateForm('text');
  }


  setid(value){
    this.validate(value, BookContent.fields.id);
    this._toManyFields.forEach(([x, fn]) => x.setFilter({[fn]: value}));
    this._id = this.parseValue(value, BookContent.fields.id);
  }

  setuser(value){
    this.validate(value, BookContent.fields.user);
    this._user.setIds(this.parseValue(value, BookContent.fields.user));
  }

  settext(value){
    this.validate(value, BookContent.fields.text);
    this._text = this.parseValue(value, BookContent.fields.text);
  }


  get id(){
    return this._id;
  }

  get user(){
    return this._user.length > 0 ? this._user[0] : this._user.new();
  }

  get text(){
    return this._text;
  }

}