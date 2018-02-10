/**
A very simple wrapper around Object.assign that creates clones of
objects.

@module util/clone
*/

/**
@function clone
@arg {Object} originalObject The base object to be cloned
@arg {Object} newProperties An object of properties to be added to the cloned output object
@returns {Object} A clone of originalObject with additional properties enumerated in newProperties
*/
export default (originalObject, newProperties) => Object.assign({}, originalObject, newProperties);
