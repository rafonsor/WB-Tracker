/**
 * Created by hplus on 01/08/2016.
 */

exports.int_to_array = function(input, length, offset, output) {
    for(var i = 0; i < length; i++) {
        if(length+offset > output.length) output.push(0x00);
        if(length+offset == output.length) output.push(input >> (i*8));
        else output[length+offset] = input >> (i*8);
    }
    return output;
};

exports.array_to_int = function(input, length) {
    var output = 0;
    for(var i = 0; i < length && i < input.length; i++) {
        output = output | (input[i+offset] << (i*8));
    }
    return output;
};