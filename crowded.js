var map, markers, icons;
var locations;
var current_location;
var search_location;
var latest_search_location;
var sorting_order;
var blue_color, yellow_color, red_color;
var blue_color2, yellow_color2, red_color2;
var kbd;
var navigation_idx, directionsService, directionsRenderer;
var toggle_fold_button;
var tutorial_index,tutorial_num;

function change_screen_size() {
    var current_map = document.getElementById("google_map");
    var popup_message = document.getElementById("confirm-message")

    if (toggle_fold_button == 0) {
        document.getElementById("fold-button2").style.display = "none";
        document.getElementById("fold-button1").style.display = "block";
        toggle_fold_button = 1;
    }
    document.getElementById("search_box").focus();
    current_map.style.left = "29.2%";
    current_map.style.width = "70.8%";
    document.getElementById("informations_div").style.display = "block";
    document.getElementById("none_display_divs").style.display = "block";
    popup_message.style.left = "52%";
}

$.ajax({
    url: './crowded_data.csv',
    dataType: 'text',
}).done(parse_crowded_data);

$(document).ready(function () {
    variables_initialization();
    events_initialization();
    get_current_location();
    //google.maps.event.addDomListener(window, 'load', init_map);
    init_map();
});

function parse_crowded_data(data) {
    var tmp;
    var allRows = data.split(/\r?\n|\r/);

    for (var i = 1; i < allRows.length - 1; i++) {
        var line = [], start = 0, tmp;
        for (var j = 0; j < allRows[i].length; j++) {
            if (allRows[i][j] == '\"') {
                var length;

                if (start != j) {
                    tmp = allRows[i].substr(start, j - 1 - start).split(',');
                    for (var k = 0; k < tmp.length; k++) {
                        line.push(tmp[k]);
                    }
                }
                for (length = 1; ; length++) {
                    if (allRows[i][j + length] == '\"') break;
                }
                line.push(allRows[i].substr(j + 1, length - 1));
                j += length;
                start = j + 2;
            }
        }
        if (start < allRows[i].length) {
            tmp = allRows[i].substr(start, allRows[i].length - start).split(',');
            for (var k = 0; k < tmp.length; k++) {
                line.push(tmp[k]);
            }
        }
        locations.push({ name: line[1], latitude: line[28], longitude: line[29], total: line[6] * 1.0, address: line[5], Mon_Fri_start: line[10], Mon_Fri_end: line[11], weekend_start: line[12], weekend_end: line[13], phone: line[27] });
    }

    tmp = [];
    locations.sort(function (a, b) {
        if (a.latitude == b.latitude) return a.longitude < b.longitude ? -1 : 1;
        return a.latitude < b.latitude;
    });
    tmp.push(locations[0]);
    for (var i = 1; i < locations.length; i++) {
        if (locations[i].latitude == locations[i - 1].latitude && locations[i].longitude == locations[i - 1].longitude) continue;
        tmp.push(locations[i]);
    }
    locations = tmp;
    for (i = 0; i < locations.length; i++) {
        if ((locations[i].Mon_Fri_start).substr(0, 2) == "오전") {
            locations[i].Mon_Fri_start = "Morning" + (locations[i].Mon_Fri_start).substr(2);
        }
        else if ((locations[i].Mon_Fri_start).substr(0, 2) == "오후") {
            locations[i].Mon_Fri_start = "Afternoon" + (locations[i].Mon_Fri_start).substr(2);
        }
        if ((locations[i].Mon_Fri_end).substr(0, 2) == "오전") {
            locations[i].Mon_Fri_end = "Morning" + (locations[i].Mon_Fri_end).substr(2);
        }
        else if ((locations[i].Mon_Fri_end).substr(0, 2) == "오후") {
            locations[i].Mon_Fri_end = "Afternoon" + (locations[i].Mon_Fri_end).substr(2);
        }
        if ((locations[i].weekend_start).substr(0, 2) == "오전") {
            locations[i].weekend_start = "Morning" + (locations[i].weekend_start).substr(2);
        }
        else if ((locations[i].weekend_start).substr(0, 2) == "오후") {
            locations[i].weekend_start = "Afternoon" + (locations[i].weekend_start).substr(2);
        }
        if ((locations[i].weekend_end).substr(0, 2) == "오전") {
            locations[i].weekend_end = "Morning" + (locations[i].weekend_end).substr(2);
        }
        else if ((locations[i].weekend_end).substr(0, 2) == "오후") {
            locations[i].weekend_end = "Afternoon" + (locations[i].weekend_end).substr(2);
        }
    }

    set_location_using();
    sort_locations();
    add_markers();
}

function set_location_using() {
    for (var i = 0; i < locations.length; i++) {
        locations[i].using = Math.floor(Math.random() * (locations[i].total + 1));
        if (locations[i].total - locations[i].using > 99) {
            i--;
            continue;
        }
        locations[i].type = get_location_type(locations[i].using, locations[i].total);
    }
}

function get_location_type(num_using, num_total) {
    if (num_total - num_using <= 10) return "crowded";
    else if (num_total - num_using < 25) return "normal";
    else return "comfort";
}

function tutorial_color_setting() {
    if (tutorial_index == 1) {
        document.getElementById("tutorial-left").style.color = "#808080";
    } else {
        document.getElementById("tutorial-left").style.color = "black";
    }
    if (tutorial_index == tutorial_num) {
        document.getElementById("tutorial-right").style.color = "#808080";
    } else {
        document.getElementById("tutorial-right").style.color = "black";
    }
    for (var i = 1; i <= tutorial_num; i++) {
        if (i == tutorial_index) {
            document.getElementById("tutorial-circle-" + i).style.backgroundColor = "black";
        } else {
            document.getElementById("tutorial-circle-" + i).style.backgroundColor = "#808080";
        }
    }
}

function click_tutorial_left() {
    if (tutorial_index != 1) {
        document.getElementById("tutorial-" + tutorial_index).style.display = "none";
        tutorial_index--;
        document.getElementById("tutorial-" + tutorial_index).style.display = "block";
        tutorial_color_setting();
    }
}

function click_tutorial_right() {
    if (tutorial_index != tutorial_num) {
        document.getElementById("tutorial-" + tutorial_index).style.display = "none";
        tutorial_index++;
        document.getElementById("tutorial-" + tutorial_index).style.display = "block";
        tutorial_color_setting();
    }
}

function variables_initialization() {
    map = null;
    markers = [];
    icons = [];
    locations = [];
    current_location = { latitude: 36.3720, longitude: 127.3630, name: "KAIST | 한국과학기술원 대덕캠퍼스" };
    search_location = { latitude: 36.3720, longitude: 127.3630, name: "KAIST | 한국과학기술원 대덕캠퍼스" };
    latest_search_location = { latitude: 36.3720, longitude: 127.3630, name: "KAIST | 한국과학기술원 대덕캠퍼스" };
    sorting_order = "Distance";
    var icon_ratio = 0.1;
    icons.push({
        url: "./image/blue-icon3.png",
        scaledSize: new google.maps.Size(570 * icon_ratio, 438 * icon_ratio),
    });
    icons.push({
        url: "./image/yellow-icon3.png",
        scaledSize: new google.maps.Size(570 * icon_ratio, 438 * icon_ratio),
    });
    icons.push({
        url: "./image/red-icon3.png",
        scaledSize: new google.maps.Size(570 * icon_ratio, 438 * icon_ratio),
    });
    blue_color = "#66B9FE"; blue_color2 = "#008CFF";
    yellow_color = "#FED866"; yellow_color2 = "#FFBF00";
    red_color = "#FE6666"; red_color2 = "#FF0000";
    toggle_fold_button = 0;
    tutorial_index = 1;
    tutorial_num = 4;
}

function events_initialization() {
    document.getElementById("search_box").focus();
    document.getElementById("keyboard_icon").addEventListener("mouseover", function (event) {
        event.target.style.color = "#000000";
    }, false);
    document.getElementById("keyboard_icon").addEventListener("mouseout", function (event) {
        event.target.style.color = "#5B5B5B";
    }, false);
    document.getElementById("search_icon").addEventListener("mouseover", function (event) {
        event.target.style.color = "#4285F4";
    }, false);
    document.getElementById("search_icon").addEventListener("mouseout", function (event) {
        event.target.style.color = "#BABABA";
    }, false);
    document.getElementById("close_icon").addEventListener("mouseover", function (event) {
        event.target.style.color = "#4285F4";
    }, false);
    document.getElementById("close_icon").addEventListener("mouseout", function (event) {
        event.target.style.color = "#BABABA";
    }, false);
    document.getElementById("my_location_icon").addEventListener("mouseover", function (event) {
        event.target.style.color = "#1A73E8";
    }, false);
    document.getElementById("my_location_icon").addEventListener("mouseout", function (event) {
        event.target.style.color = "#5B5B5B";
    }, false);
    document.getElementById("my_location_text").addEventListener("mouseover", function (event) {
        document.getElementById("my_location_icon").style.color = "#1A73E8";
    }, false);
    document.getElementById("my_location_text").addEventListener("mouseout", function (event) {
        document.getElementById("my_location_icon").style.color = "#5B5B5B";
    }, false);
    document.getElementById("sort_icon").addEventListener("mouseover", function (event) {
        event.target.style.color = "#1A73E8";
    }, false);
    document.getElementById("sort_icon").addEventListener("mouseout", function (event) {
        event.target.style.color = "#5B5B5B";
    }, false);
    document.getElementById("sort_text").addEventListener("mouseover", function (event) {
        document.getElementById("sort_icon").style.color = "#1A73E8";
    }, false);
    document.getElementById("sort_text").addEventListener("mouseout", function (event) {
        document.getElementById("sort_icon").style.color = "#5B5B5B";
    }, false);
    document.getElementById("navigation-cancel").addEventListener('click', function () {
        document.getElementById("navigation-message").style.display = "none";
    });
    document.getElementById("navigation-submit").addEventListener('click', function () {
        document.getElementById("navigation-message").style.display = "none";
        start_navigation();
    });
    document.getElementById("fold-button1").addEventListener('click', function () {
        fold_function();
    });
    document.getElementById("fold-button2").addEventListener('click', function () {
        fold_function();
    });
    document.getElementById("tutorial-color").addEventListener('click', function () {
        document.getElementById("tutorial").style.display = "none";
        document.getElementById("tutorial-color").style.display = "none";
    });
    document.getElementById("tutorial-close").addEventListener('mouseover', function () {
        event.target.style.color = "black";
    });
    document.getElementById("tutorial-close").addEventListener('mouseout', function () {
        event.target.style.color = "#808080";
    });
    document.getElementById("tutorial-close").addEventListener('click', function () {
        document.getElementById("tutorial").style.display = "none";
        document.getElementById("tutorial-color").style.display = "none";
    });
    document.getElementById("tutorial-left-div").addEventListener('mouseover', function () {
        event.target.style.backgroundColor = "#DCDCDC";
    });
    document.getElementById("tutorial-left-div").addEventListener('mouseout', function () {
        event.target.style.backgroundColor = "#F5F5F5";
    });
    document.getElementById("tutorial-left-div").addEventListener('click', function () {
        click_tutorial_left();
    });
    document.getElementById("tutorial-left").addEventListener('mouseover', function () {
        document.getElementById("tutorial-left-div").style.backgroundColor = "#DCDCDC";
    });
    document.getElementById("tutorial-left").addEventListener('mouseout', function () {
        document.getElementById("tutorial-left-div").style.backgroundColor = "#F5F5F5";
    });
    document.getElementById("tutorial-left").addEventListener('click', function () {
        click_tutorial_left();
    });
    document.getElementById("tutorial-right-div").addEventListener('mouseover', function () {
        event.target.style.backgroundColor = "#DCDCDC";
    });
    document.getElementById("tutorial-right-div").addEventListener('mouseout', function () {
        event.target.style.backgroundColor = "#F5F5F5";
    });
    document.getElementById("tutorial-right-div").addEventListener('click', function () {
        click_tutorial_right();
    });
    document.getElementById("tutorial-right").addEventListener('mouseover', function () {
        document.getElementById("tutorial-right-div").style.backgroundColor = "#DCDCDC";
    });
    document.getElementById("tutorial-right").addEventListener('mouseout', function () {
        document.getElementById("tutorial-right-div").style.backgroundColor = "#F5F5F5";
    });
    document.getElementById("tutorial-right").addEventListener('click', function () {
        click_tutorial_right();
    });
    for (var i = 1; i <= tutorial_num; i++) {
        document.getElementById("tutorial-circle-" + i).addEventListener('click', function () {
            document.getElementById("tutorial-" + tutorial_index).style.display = "none";
            tutorial_index = event.target.id.substr(16);
            document.getElementById("tutorial-" + tutorial_index).style.display = "block";
            tutorial_color_setting();
        })
    }
    for (var i = 0; i < 20; i++) {
        var cell = document.getElementById("cell" + i);

        cell.addEventListener("click", function (event) {
            var idx;
            var tmp = event.target;

            while (tmp.id.substr(0, 4) != "cell") {
                if (tmp.id.substr(0, 3) == "nav") return;
                tmp = tmp.parentNode;
            }
            idx = tmp.id.substr(4);
            show_one_information(idx);
        }, false);
        cell.addEventListener("mouseover", function (event) {
            var idx;
            var tmp = event.target;

            while (tmp.id.substr(0, 4) != "cell") tmp = tmp.parentNode;
            idx = tmp.id.substr(4);

            change_all_color(tmp, "#FAFAFA");
            markers[idx+1].setAnimation(google.maps.Animation.BOUNCE);
        }, false);
        cell.addEventListener("mouseout", function (event) {
            var idx;
            var tmp = event.target;

            while (tmp.id.substr(0, 4) != "cell") tmp = tmp.parentNode;
            idx = tmp.id.substr(4);

            change_all_color(tmp, "#FFFFFF");
            markers[idx + 1].setAnimation(null);
        }, false);
    }

    //alerts, 구현하신 부분은 alert 지우셔도 될 것 같습니다. 추가로 이벤트 실행 후 검색창 focus가 되도록 해야될 것 같습니다.
    document.getElementById("keyboard_icon").addEventListener("click", function (event) {

    }, false);
    document.getElementById("search_icon").addEventListener("click", function (event) {
        var options_auto = {
            componentRestrictions: { country: "kr" }
        };
        var mapinput = document.getElementById("search_box");
        var autocomplete = new google.maps.places.Autocomplete(mapinput, options_auto);
        autocomplete.bindTo('bounds', map);
        autocomplete.setFields(
            ['address_components', 'geometry', 'icon', 'name']);
        var place = autocomplete.getPlace();
        /*
        console.log(place);
        if (place === undefined) {
          place = $('search_box').autocomplete({selectFirst:true});
        }*/
        var lat = place.geometry.location.lat();
        var lng = place.geometry.location.lng();
        search_location.latitude = lat;
        search_location.longitude = lng;
        search_location.name = place.name;
        search_location_changed();
    }, false);
    document.getElementById("close_icon").addEventListener("click", function (event) {
        document.getElementById("search_box").value = "";
    }, false);
    document.getElementById("my_location_icon").addEventListener("click", function (event) {
        search_location_changed();
        document.getElementById("my_location_text").innerHTML = "Searching for parking lots near<br/>" + search_location.name;
    }, false);
    document.getElementById("my_location_text").addEventListener("click", function (event) {
        search_location_changed();
        document.getElementById("my_location_text").innerHTML = "Searching for parking lots near<br/>" + search_location.name;
    }, false);
    document.getElementById("sort_icon").addEventListener("click", function (event) {
        var tmp = [];

        for (var i = 0; i < 20; i++) tmp.push(locations[i]);
        if (sorting_order == "Distance") {
            tmp.sort(function (a, b) {
                return (a.total - a.using > b.total - b.using) ? -1 : 1;
                if (a.type != b.type) {
                    if (a.type == "comfort" || (a.type == "normal" && b.type == "crowded")) return -1;
                    else return 1;
                }
                return a.distance < b.distance ? -1 : 1;
            });
            sorting_order = "Remaining Spaces"
        } else {
            tmp.sort(function (a, b) {
                return a.distance < b.distance ? -1 : 1;
            });
            sorting_order = "Distance"
        }
        for (var i = 0; i < 20; i++) locations[i] = tmp[i];
        document.getElementById("sort_text").innerHTML = "Sorted by: <br>" + sorting_order;
        show_informations();
    }, false);
    document.getElementById("sort_text").addEventListener("click", function (event) {
        var tmp = [];

        for (var i = 0; i < 20; i++) tmp.push(locations[i]);
        if (sorting_order == "Distance") {
            tmp.sort(function (a, b) {
                return (a.total - a.using > b.total - b.using) ? -1 : 1;
                if (a.type != b.type) {
                    if (a.type == "comfort" || (a.type == "normal" && b.type == "crowded")) return -1;
                    else return 1;
                }
                return a.distance < b.distance ? -1 : 1;
            });
            sorting_order = "Remaining Spaces"
        } else {
            tmp.sort(function (a, b) {
                return a.distance < b.distance ? -1 : 1;
            });
            sorting_order = "Distance"
        }
        for (var i = 0; i < 20; i++) locations[i] = tmp[i];
        event.target.innerHTML = "Sorted by: <br>" + sorting_order;
        show_informations();
    }, false);
}

function change_all_color(parent, color) {
    parent.style.backgroundColor = color;
    if (!parent.hasChildNodes()) return;
    children = parent.childNodes;
    for (var i = 0; i < children.lengt; i++) change_all_color(children[i], color);
}

function bytelimit(obj) {
    var maxbyte = 31;
    var objlen = obj.length;
    var rbyte = 0;
    var rlen = 0;
    var one_char = "";
    var str2 = ""
    for (var i = 0; i < objlen; i++) {
        one_char = obj.charAt(i);
        if (escape(one_char).length > 4) {
            rbyte += 2;
        }
        else {
            rbyte++;
        }
        if (rbyte <= maxbyte) {
            rlen = i + 1;
        }
    }
    var temp = obj;
    if (rbyte > maxbyte) {
        temp = obj.substr(0, rlen);
        temp += '..';
    }
    return temp;
}

function show_informations() {
    change_screen_size();
    document.getElementById("information_display1").style.display = "block";
    document.getElementById("information_display2").style.display = "none";
    for (var i = 0; i < 20; i++) {
        var cell = document.getElementById("cell" + i);
        var type = get_location_type(locations[i].using, locations[i].total);
        str = '<p style="font-size: medium;width:230px;display:inline;position:absolute;left: 10px;cursor:pointer;">';
        str += '<b>';
        str += locations[i].name;
        str += '</b>';
        str += '</p>';
        if (type == 'comfort') {
            str += '<p style="font-size: medium;color:#008CFF;display:inline;position:absolute;left: 230px;">';
        }
        else if (type == 'normal') {
            str += '<p style="font-size: medium;color:#FFBF00;display:inline;position:absolute;left: 230px;">';
        }
        else {
            str += '<p style="font-size: medium;color:#FF0000;display:inline;position:absolute;left: 230px;">';
        }
        str += '&#160;&#160;&#160;&#160;Empty space: ';
        str += locations[i].total - locations[i].using;
        str += '</p>';
        if (type == 'comfort') {
            str += '<i class="far fa-grin fa-2x" style="color:#66B9FE; position:relative;left:400px;top:10px;"></i><br>';
        }
        else if (type == 'normal') {
            str += '<i class="far fa-meh fa-2x" style="color:#FED866; position:relative;left:400px;top:10px;"></i><br>';
        }
        else {
            str += '<i class="far fa-frown fa-2x" style="color:#FE6666; position:relative;left:400px;top:10px;"></i><br>';
        }
        str += '<p style="font-size: 12px;width:270px;position:absolute;bottom:3px;right:180px">';;
        str += '<br><br>&#160;&#160;&#160;&#160;&#160;Distance: ';
        str += parseInt(locations[i].distance);
        str += 'm';
        str += '<br>&#160;&#160;&#160;&#160;&#160;Address: ';
        str += bytelimit(locations[i].address);
        str += '<br>&#160;&#160;&#160;&#160;&#160;Until ';
        str += locations[i].Mon_Fri_end;
        str += ', ';
        str += locations[i].phone;
        str += '</p>';
        str += '<img src="./image/parking_lots/';
        str += i % 10;
        str += '.jpg" alt="cannot find the image" style="width:108px;height:54px;float:right;position:absolute;right: 68px; bottom: 18px;">';

        str += '<div id="navig';
        str += i;
        str += '" style="color:#66B9FE;">';
        str += '<i class="fas fa-location-arrow fa-2x" style="width:40px;height:40px;float:right;position:absolute;right: 10px; bottom: 30px;cursor:pointer;"></i>';
        str += '<p style="font-size: 10px;position:absolute;right: 20px; bottom: 8px;cursor:pointer;">nav</p>';
        str += '</div>';

        cell.innerHTML = str;
    }

    var popup_navigation = document.getElementById("navigation-message");
    for (var i = 0; i < 20; i++) {
        var nav = document.getElementById("navig" + i);
        $(document).ready(function () {
            $(nav).hover(function () {
                $(this).css("color", "#008CFF");
            }, function () {
                $(this).css("color", "#66B9FE");
            });
        });
    }
}

function show_one_information(i) {
    change_screen_size();
    document.getElementById("information_display1").style.display = "none";
    document.getElementById("information_display2").style.display = "block";

    var Latdelta, Lngdelta;
    var bounds;

    Latdelta = Math.abs(search_location.latitude - locations[i].latitude);
    Lngdelta = Math.abs(search_location.longitude - locations[i].longitude);
    bounds = new google.maps.LatLngBounds();

    bounds.extend(new google.maps.LatLng(locations[i].latitude - Latdelta, locations[i].longitude - Lngdelta));
    bounds.extend(new google.maps.LatLng(locations[i].latitude + Latdelta, locations[i].longitude + Lngdelta));

    adjust_zoom();
    map.setCenter(new google.maps.LatLng(locations[i].latitude, locations[i].longitude));
    //map.fitBounds(bounds);

    var cell = document.getElementById("cell20");
    var type = get_location_type(locations[i].using, locations[i].total);

    str = '<p id="back';
    str += i;
    str += '" style="color:#1A73E8;font-size: 15px;width:320px;position:absolute;left:20px;cursor: pointer;">';
    str += 'Go back to previous search results';
    str += '</p>';

    str += '<p style="font-size: 25px;width:320px;position:absolute;left: 20px;top:30px;">';
    str += '<b>';
    str += locations[i].name;
    str += '</b>';
    str += '</p>';

    if (type == 'comfort') {
        str += '<p style="font-size: 20px;color:#008CFF;position:absolute;top:130px;left:25px;">';
    }
    else if (type == 'normal') {
        str += '<p style="font-size: 20px;color:#FFBF00;position:absolute;top:130px;left:25px;">';
    }
    else {
        str += '<p style="font-size: 20px;color:#FF0000;position:absolute;top:130px;left:25px;">';
    }
    str += 'Empty space: ';
    str += locations[i].total - locations[i].using;
    str += '</p>';

    if (type == 'comfort') {
        str += '<i class="far fa-grin fa-4x" style="color:#66B9FE; position:relative;left:350px;top:40px;"></i><br>';
    }
    else if (type == 'normal') {
        str += '<i class="far fa-meh fa-4x" style="color:#FED866; position:relative;left:350px;top:40px;"></i><br>';
    }
    else {
        str += '<i class="far fa-frown fa-4x" style="color:#FE6666; position:relative;left:350px;top:40px;"></i><br>';
    }
    str += '<br><br>';

    str += '<p style="font-size: 13px;position:absolute; top: 190px; left: 25px">';;
    str += 'Distance: ';
    str += parseInt(locations[i].distance);
    str += 'm';

    str += '<br>Address: ';
    str += locations[i].address;

    str += '<br>Weekday: ';
    str += locations[i].Mon_Fri_start;
    str += '-';
    str += locations[i].Mon_Fri_end;
    str += '<br>Weekend: ';
    str += locations[i].weekend_start;
    str += '-';
    str += locations[i].weekend_end;
    str += '<br>Phone: ';
    str += locations[i].phone;

    str += '</p>';

    str += '<div id="navi';
    str += i;
    str += '" style="color:#66B9FE;">';
    str += '<i class="fas fa-location-arrow fa-4x" style="width:40px;height:40px;float:right;position:absolute;right: 65px; bottom: 350px;cursor: pointer;"></i>';
    str += '<p style="font-size: 10px;width:50px;text-align:center;position:absolute;right: 50px; bottom: 285px;cursor: pointer;">start navigation</p>';
    str += '</div>';

    str += '<img src="./image/parking_lots/';
    str += i % 10;
    str += '.jpg" alt="cannot find the image" style="width:400px;height:200px;float:right;position:absolute;right: 24px; bottom: 15px;">';

    cell.innerHTML = str;
    var confirm = document.getElementById("confirm-message");
    document.getElementById("confirm-cancel").addEventListener('click', function () {
        confirm.style.display = "none";
    });
    document.getElementById("confirm-submit").addEventListener('click', function () {
        confirm.style.display = "none";
    });
    document.getElementById("confirm-content").innerHTML = "Do you want to start navigation?<br>";
    var nav = document.getElementById("navi" + i);
    $(document).ready(function () {
        $(nav).hover(function () {
            $(this).css("color", "#008CFF");
        }, function () {
            $(this).css("color", "#66B9FE");
        });
    });
    nav.addEventListener("click", function (event) {
        if (popup_navigation.style.display == "block") {

        }
        popup_navigation.style.display = "block";
        navigation_idx = event.target.id.substr(3);
    }, false);
    var back = document.getElementById("back" + i);
    back.addEventListener("mouseover", function (event) {
        event.target.style.textDecoration = "underline";
    }, false);
    back.addEventListener("mouseout", function (event) {
        event.target.style.textDecoration = "none";
    }, false);
    back.addEventListener("click", function (event) {
        show_informations();
    }, false);
}

function get_current_location() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            current_location = { latitude: position.coords.latitude, longitude: position.coords.longitude };
            search_location.latitude = current_location.latitude;
            search_location.longitude = current_location.longitude;
            if (markers.length == 0) {
                markers.push(new google.maps.LatLng(search_location.latitude, search_location.longitude));
            } else {
                markers[0].setPosition(new google.maps.LatLng(search_location.latitude, search_location.longitude));
            }
            if (map != null) {
                var tmp = new google.maps.LatLng(search_location.latitude, search_location.longitude);
                map.setCenter(tmp);
                markers[0].setPosition(tmp);
            }
            remove_markers();
            sort_locations();
            add_markers();

            var request = {
                key: "AIzaSyDbs4oxA3ULW_MHD0Y7hsXoiU_uY-COiWQ",
                location: new google.maps.LatLng(search_location.latitude, search_location.longitude),
                radius: '1000',
                rankby: "distance"
            };
            var service = new google.maps.places.PlacesService(map);
            service.nearbySearch(request, callback2);
        });
    }
}

function callback2(results, status) {
    if (status != google.maps.places.PlacesServiceStatus.OK || results.length == 0) return;
    var index = results.length - 1;

    for (var i = 0; i < results.length; i++) {
        var flag = false;
        for (var j = 0; j < results[i].types.length; j++) {
            if (results[i].types[j] == "political") {
                flag = true;
                break;
            }
        }
        if (!flag) {
            index = i;
            break;
        }
    }
    if ((results[index].name + results[index].vicinity).length <= 20) {
        search_location.name = results[index].vicinity + " " + results[index].name;
    } else {
        search_location.name = results[index].name;
    }
    document.getElementById("my_location_text").innerHTML = "Searching for parking lots near<br>" + search_location.name;
}

function sort_locations() {
    var search_LatLng = new google.maps.LatLng(search_location.latitude, search_location.longitude);

    for (var i = 0; i < locations.length; i++) {
        locations[i].distance = google.maps.geometry.spherical.computeDistanceBetween(search_LatLng, new google.maps.LatLng(locations[i].latitude, locations[i].longitude));
    }
    locations.sort(function (a, b) {
        return a.distance < b.distance ? -1 : 1;
    });
}

function init_map() {
    var zoom_div = document.createElement("div");
    var zoom_in = document.createElement("button");
    var zoom_out = document.createElement("button");
    var confirm = document.getElementById("confirm-message");

    zoom_div.className = "controls zoom-control";
    zoom_in.innerHTML = "+";
    zoom_in.className = "zoom-control-in";
    zoom_out.innerHTML = "-";
    zoom_out.className = "zoom-control-out";
    zoom_div.appendChild(zoom_in);
    zoom_div.appendChild(zoom_out);

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    map = new google.maps.Map(document.getElementById('google_map'), {
        zoom: 15,
        center: new google.maps.LatLng(search_location.latitude, search_location.longitude),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true
    });
    directionsRenderer.setMap(map);

    var options_auto = {
        componentRestrictions: { country: "kr" }
    };

    var mapinput = document.getElementById("search_box");
    var autocomplete = new google.maps.places.Autocomplete(mapinput, options_auto);
    autocomplete.bindTo('bounds', map);
    autocomplete.setFields(
        ['address_components', 'geometry', 'icon', 'name']);

    if (markers.length == 0) {
        var marker = new google.maps.Marker({
            position: new google.maps.LatLng(search_location.latitude, search_location.longitude),
            map: map
        });
        markers.push(marker);
    }

    initZoomControl(zoom_in, zoom_out, zoom_div);
    sort_locations();
    add_markers();
    document.getElementById("my_location_text").innerHTML = "Searching for parking lots near<br/>" + search_location.name;

    autocomplete.addListener('place_changed', function () {

        var place = autocomplete.getPlace();
        if (place.geometry === undefined) {
            place = $('search_box').autocomplete({ selectFirst: true });
        }
        var lat = place.geometry.location.lat();
        var lng = place.geometry.location.lng();
        search_location.latitude = lat;
        search_location.longitude = lng;
        search_location.name = place.name;
        search_location_changed();
    });

    document.getElementById("confirm-cancel").addEventListener('click', function () {
        confirm.style.display = "none";
        markers[0].setPosition(new google.maps.LatLng(search_location.latitude, search_location.longitude));
    });
    document.getElementById("confirm-submit").addEventListener('click', function () {
        confirm.style.display = "none";
        search_location.latitude = latest_search_location.latitude;
        search_location.longitude = latest_search_location.longitude;
        search_location.name = latest_search_location.name;
        search_location_changed();
    });

    map.addListener('click', function (mapsMouseEvent) {
        var request;
        var tmp = mapsMouseEvent.latLng.toString().split(',');

        latest_search_location.latitude = tmp[0].substr(1) * 1.0;
        latest_search_location.longitude = tmp[1].substr(1, tmp[1].length - 2) * 1.0;
        if (markers.length != 0) {
            markers[0].setPosition(new google.maps.LatLng(latest_search_location.latitude, latest_search_location.longitude));
        } else {
            markers.push(new google.maps.LatLng(latest_search_location.latitude, latest_search_location.longitude));
        }
        var request = {
            key: "AIzaSyDbs4oxA3ULW_MHD0Y7hsXoiU_uY-COiWQ",
            location: new google.maps.LatLng(latest_search_location.latitude, latest_search_location.longitude),
            radius: '1000',
            rankby: "distance"
        };
        var service = new google.maps.places.PlacesService(map);
        service.nearbySearch(request, callback);
        search_location.latitude = latest_search_location.latitude;
        search_location.longitude = latest_search_location.longitude;
        search_location.name = latest_search_location.name;
        search_location_changed();
    });

    function callback(results, status) {
        if (status != google.maps.places.PlacesServiceStatus.OK || results.length == 0) return;
        var index = results.length - 1;

        for (var i = 0; i < results.length; i++) {
            var flag = false;
            for (var j = 0; j < results[i].types.length; j++) {
                if (results[i].types[j] == "political") {
                    flag = true;
                    break;
                }
            }
            if (!flag) {
                index = i;
                break;
            }
        }
        if ((results[index].name + results[index].vicinity).length <= 20) {
            latest_search_location.name = results[index].vicinity + " " + results[index].name;
        } else {
            latest_search_location.name = results[index].name;
        }
        document.getElementById("confirm-content").innerHTML = "Are you going to set this<br>as your destination?<br>(" + latest_search_location.name + ")";
    }
}

function search_location_changed() {
    if (map != null) {
        var tmp = new google.maps.LatLng(search_location.latitude, search_location.longitude);
        map.setCenter(tmp);
        markers[0].setPosition(tmp);
    }
    remove_markers();
    sort_locations();
    add_markers();
    document.getElementById("my_location_text").innerHTML = "Searching for parking lots near<br/>" + search_location.name;
    show_informations();
}

function add_markers() {
    var infowindow = new google.maps.InfoWindow();
    if (locations.length == 0) return;

    if (markers.length == 0) {
        var marker = new google.maps.Marker({
            position: new google.maps.LatLng(search_location.latitude, search_location.longitude),
            map: map
        });
        markers.push(marker);
    }
    for (var i = 0; i < 20; i++) {
        var icon_idx;

        if (locations[i].type == "comfort") icon_idx = 0;
        else if (locations[i].type == "normal") icon_idx = 1;
        else icon_idx = 2;

        var marker = new google.maps.Marker({
            position: new google.maps.LatLng(locations[i].latitude, locations[i].longitude),
            map: map,
            icon: icons[icon_idx],
        });
        markers.push(marker);

        google.maps.event.addListener(marker, 'click', (function (marker, i) {
            return function () {
                show_one_information(i);
            }
        })(marker, i));

        google.maps.event.addListener(marker, 'mouseover', (function (marker, i) {
            return function () {
                infowindow.setContent(locations[i].name + "<br>" + "Empty Spaces : " + (locations[i].total - locations[i].using)
                +"<br>" + "Distance : " + Math.round(locations[i].distance) + "m, \(" + Math.ceil(locations[i].distance/83) + " minutes on foot\)");
                infowindow.open(map, marker);
            }
        })(marker, i));
        google.maps.event.addListener(marker, 'mouseout', (function (marker, i) {
            return function () {
                infowindow.close();
            }
        })(marker, i));
    }
    adjust_zoom();
}

function remove_markers() {
    while (markers.length != 1) {
        var marker = markers.pop();
        marker.setMap(null);
    }
}

function initZoomControl(zoom_in, zoom_out, zoom_div) {
    zoom_in.onclick = function () {
        map.setZoom(map.getZoom() + 1);
    };
    zoom_out.onclick = function () {
        map.setZoom(map.getZoom() - 1);
    };
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(zoom_div);
}

function start_navigation() {
    directionsService.route({
        origin: new google.maps.LatLng(current_location.latitude, current_location.longitude),
        destination: new google.maps.LatLng(locations[navigation_idx].latitude, locations[navigation_idx].longitude),
        travelMode: 'DRIVING'
    },
        function (response, status) {
            if (status === 'OK') {
                directionsRenderer.setDirections(response);
            }
        });
}

function adjust_zoom() {
    var minLat, maxLat, minLng, maxLng;
    var Latdelta, Lngdelta;
    var bounds;

    minLat = maxLat = search_location.latitude;
    minLng = maxLng = search_location.longitude;
    bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < 20; i++) {
        minLat = Math.min(minLat, locations[i].latitude);
        maxLat = Math.max(maxLat, locations[i].latitude);
        minLng = Math.min(minLng, locations[i].longitude);
        maxLng = Math.max(maxLng, locations[i].longitude);
    }
    Latdelta = Math.max(Math.abs(search_location.latitude - minLat), Math.abs(maxLat - search_location.latitude));
    Lngdelta = Math.max(Math.abs(search_location.longitude - minLng), Math.abs(maxLng - search_location.longitude));

    bounds.extend(new google.maps.LatLng(search_location.latitude - Latdelta, search_location.longitude - Lngdelta));
    bounds.extend(new google.maps.LatLng(search_location.latitude + Latdelta, search_location.longitude + Lngdelta));

    map.fitBounds(bounds);
}

function fold_function() {
    if (toggle_fold_button == 0) {
        document.getElementById("fold-button2").style.display = "none";
        document.getElementById("fold-button1").style.display = "block";
        show_informations();

        toggle_fold_button = 1;
    } else {
        var current_map = document.getElementById("google_map");
        var popup_message = document.getElementById("confirm-message")

        current_map.style.left = "0%";
        current_map.style.width = "100%";
        document.getElementById("informations_div").style.display = "none";
        document.getElementById("none_display_divs").style.display = "none";
        popup_message.style.left = "38%";

        document.getElementById("fold-button1").style.display = "none";
        document.getElementById("fold-button2").style.display = "block";
        toggle_fold_button = 0;
    }
}
