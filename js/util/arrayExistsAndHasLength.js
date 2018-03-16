/**
Verify that the input argument exists (is truthy) and has a non-zero
length property.

@module util/arrayExistsAndHasLength
*/

/**
@function arrayExistsAndHasLength
@arg {Array} array
@returns {boolean}
*/
export default array => array && array.length !== 0;
