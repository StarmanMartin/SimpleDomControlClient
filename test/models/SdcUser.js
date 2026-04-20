import {SdcModel} from 'sdc_client';

export default class SdcUser extends SdcModel {

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
      "username": {
        "type": "CharField",
        "required": false,
        "max_length": 255,
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
    super("SdcUser");
    this._id = null;
    this._username = null;
    this.setValues(data);
  }

  setValues(data = {}) {
    try {
      this.id = data.id ?? data.pk ?? null;
    } catch {}
    try {
      this.username = data.username ?? null;
    } catch {}
  }

  set id(value){
    this.setid(value);
    this._updateForm('id');
  }

  set username(value){
    this.setusername(value);
    this._updateForm('username');
  }

  setid(value){
    this.validate(value, SdcUser.fields.id);
    this._id = this.parseValue(value, SdcUser.fields.id);
  }

  setusername(value){
    this.validate(value, SdcUser.fields.username);
    this._username = this.parseValue(value, SdcUser.fields.username);
  }

  get id(){
    return this._id;
  }

  get username(){
    return this._username;
  }
}
