
def find_string_in_parsed_result(top, strng, cur_pos):
    """Iterate through field parsed result to find location of a string"""
    for n, el in enumerate(top):
        if type(el) is tuple:
            if strng in el[1]:
                cur_pos.append(n)
                return cur_pos
        else:
            cur_pos.append(n)
            res = find_string_in_parsed_result(el.parsed_result, strng, cur_pos)
            if res:
                return res
            cur_pos.pop()
    return None
