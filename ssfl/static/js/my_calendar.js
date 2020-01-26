var button_state = (function () {
    let al_state = false;
    let il_state = true;
    let religion_state = false;
    let wellness_state = false;
    let event_state = true;
    let club_state = false;
    let audiences = [al_state, il_state];
    let audience_names = ['AL', 'IL'];
    let categories = [event_state, wellness_state, religion_state, club_state];
    let category_names = ['Event', 'Wellness', 'Religion', 'Resident Clubs'];
    return {
        initialize: function () {
            //Do anything needed here
        },
        set_audience: function (btn) {
            for (let i = 0; i < audiences.length; i++) {
                audiences[i] = false;
                if (btn.textContent == audience_names[i]) audiences[i] = true;
            }
        },
        set_category: function (btn) {
            let res = '';
            for (let i = 0; i < categories.length; i++) {
                categories[i] = false;
                if (btn.textContent == category_names[i]) {
                    categories[i] = true;
                    res = category_names[i];
                }
            }
        },
        get_audience: function () {
            for (let i = 0; i < audiences.length; i++) {
                if (audiences[i]) {
                    return audience_names[i];
                }
            }
        },
        get_category: function () {
            for (let i = 0; i < categories.length; i++) {
                if (categories[i]) {
                    return category_names[i];
                }

            }
        },
    }
})();