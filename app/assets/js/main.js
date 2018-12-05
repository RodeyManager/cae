;
(function () {
  'use strict';

  $(function () {
    console.log('window loaded init');

    $('#city').change(getWaterInfo);

    getWaterInfo();

    function getWaterInfo() {
      var cityCode = $('#city').val();
      $.get('home/water?city=' + cityCode, function (res) {
        $('#water-info').text(JSON.stringify(res.data, null, 2));
      });
    }

  });

})();
