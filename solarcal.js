let powerChart = null;
      let batteryChart = null;
      let importedData = null;
      let loadProfile = null;
      let batterySoCChart = null;
      let batteryRateChart = null;

      // ค่าไฟฟ้าแต่ละช่วงเวลา (บาท/kWh)
      const ELECTRICITY_RATES = [
        { hour: 0, price: 2.5 }, // 00:00-01:00
        { hour: 1, price: 2.5 }, // 01:00-02:00
        { hour: 2, price: 2.5 }, // 02:00-03:00
        { hour: 3, price: 2.5 }, // 03:00-04:00
        { hour: 4, price: 2.5 }, // 04:00-05:00
        { hour: 5, price: 2.5 }, // 05:00-06:00
        { hour: 6, price: 2.5 }, // 06:00-07:00
        { hour: 7, price: 2.5 }, // 07:00-08:00
        { hour: 8, price: 2.5 }, // 08:00-09:00
        { hour: 9, price: 4.5 }, // ช่วง Peak: 09:00-10:00
        { hour: 10, price: 4.5 }, // ช่วง Peak: 10:00-11:00
        { hour: 11, price: 4.5 }, // ช่วง Peak: 11:00-12:00
        { hour: 12, price: 4.5 }, // ช่วง Peak: 12:00-13:00
        { hour: 13, price: 4.5 }, // ช่วง Peak: 13:00-14:00
        { hour: 14, price: 4.5 }, // ช่วง Peak: 14:00-15:00
        { hour: 15, price: 4.5 }, // ช่วง Peak: 15:00-16:00
        { hour: 16, price: 4.5 }, // ช่วง Peak: 16:00-17:00
        { hour: 17, price: 4.5 }, // ช่วง Peak: 17:00-18:00
        { hour: 18, price: 4.5 }, // ช่วง Peak: 18:00-19:00
        { hour: 19, price: 4.5 }, // ช่วง Peak: 19:00-20:00
        { hour: 20, price: 4.5 }, // ช่วง Peak: 20:00-21:00
        { hour: 21, price: 4.5 }, // ช่วง Peak: 21:00-22:00
        { hour: 22, price: 2.5 }, // 22:00-23:00
        { hour: 23, price: 2.5 }, // 23:00-00:00
      ];

      const PEAK_THRESHOLD = 4.0; // บาทต่อหน่วย สำหรับกำหนดว่าช่วงไหนเป็น peak

      const PANEL_SPECS = [
        {
          type: "Mono",
          name: "Panasonic X Series",
          brand: "Panasonic",
          width: 1.0,
          height: 1.7,
          capacity: 0.32,
        },
        {
          type: "Poly",
          name: "Trina Solar 320W",
          brand: "Trina",
          width: 1.0,
          height: 1.956,
          capacity: 0.32,
        },
        {
          type: "Thin Film",
          name: "First Solar Series 6",
          brand: "First Solar",
          width: 1.2,
          height: 2.0,
          capacity: 0.42,
        },
        {
          type: "Poly",
          name: "SolarTron SP250",
          brand: "Solar Tron",
          width: 1.0,
          height: 1.7,
          capacity: 0.25,
        },
      ];

      function updateElectricityRateInfo() {
        // ตรวจสอบว่ามีส่วนแสดงข้อมูลค่าไฟฟ้าหรือไม่
        const electricityRatesSection = document.querySelector(".card-title");
        if (
          !electricityRatesSection ||
          electricityRatesSection.textContent !== "Electricity Rates"
        ) {
          return;
        }

        // แบ่งชั่วโมงตามช่วงเวลา
        const offPeakMorningHours = 9; // 00:00-09:00
        const peakHours = 13; // 09:00-22:00
        const offPeakNightHours = 2; // 22:00-24:00

        // คำนวณเปอร์เซ็นต์ของวัน
        const offPeakMorningPercent = (offPeakMorningHours / 24) * 100;
        const peakPercent = (peakHours / 24) * 100;
        const offPeakNightPercent = (offPeakNightHours / 24) * 100;

        // ค่าไฟฟ้าเฉลี่ยแต่ละช่วง
        const offPeakRate = 2.5; // บาทต่อหน่วย
        const peakRate = 4.5; // บาทต่อหน่วย

        // อัพเดทข้อมูล
        const progressBars = electricityRatesSection
          .closest(".card-body")
          .querySelectorAll(".progress-bar");
        if (progressBars && progressBars.length === 3) {
          progressBars[0].style.width = `${offPeakMorningPercent}%`;
          progressBars[0].setAttribute("aria-valuenow", offPeakMorningPercent);
          progressBars[0].textContent = `Off-Peak (${offPeakMorningHours}h)`;

          progressBars[1].style.width = `${peakPercent}%`;
          progressBars[1].setAttribute("aria-valuenow", peakPercent);
          progressBars[1].textContent = `Peak (${peakHours}h)`;

          progressBars[2].style.width = `${offPeakNightPercent}%`;
          progressBars[2].setAttribute("aria-valuenow", offPeakNightPercent);
          progressBars[2].textContent = `Off-Peak (${offPeakNightHours}h)`;
        }

        // อัพเดทข้อความ
        const infoTexts = electricityRatesSection
          .closest(".card-body")
          .querySelectorAll(".d-flex span");
        if (infoTexts && infoTexts.length === 2) {
          infoTexts[0].textContent = `Off-Peak Hours (00:00-09:00, 22:00-24:00): ${offPeakRate.toFixed(
            2
          )} ฿/kWh`;
          infoTexts[1].textContent = `Peak Hours (09:00-22:00): ${peakRate.toFixed(
            2
          )} ฿/kWh`;
        }
      }

      const calculateTotalCapacity = (areas) => {
        return areas.reduce((total, area) => {
          const panelSpec = PANEL_SPECS[area.selectedPanelIndex];
          return total + panelSpec.capacity * area.panelCount;
        }, 0);
      };

      async function handleLoadProfileUpload(input) {
        try {
          const file = input.files[0];
          if (!file) {
            throw new Error("No file selected");
          }

          document.getElementById("loadFileName").textContent = file.name;

          // ตรวจสอบนามสกุลไฟล์
          if (!file.name.toLowerCase().endsWith(".json")) {
            throw new Error("Invalid file format. Please select a JSON file.");
          }

          // อ่านและแปลงเป็น JSON
          const text = await file.text();
          let loadProfile;

          try {
            loadProfile = JSON.parse(text);
          } catch (e) {
            throw new Error("Invalid JSON format: " + e.message);
          }

          // ตรวจสอบและซ่อมแซมโครงสร้างข้อมูล
          if (!loadProfile.data) {
            console.warn("Missing 'data' array, creating empty array");
            loadProfile.data = [];
          }

          if (!Array.isArray(loadProfile.data)) {
            console.warn("'data' is not an array, converting to array");
            loadProfile.data = Object.values(loadProfile.data).filter(
              (item) =>
                typeof item === "object" && item !== null && "load" in item
            );
          }

          // ถ้าไม่มีข้อมูลครบ 24 ชั่วโมง ให้สร้างเพิ่มหรือปรับให้ครบ 24 ชั่วโมง
          if (loadProfile.data.length !== 24) {
            console.warn(
              `Adjusting data length from ${loadProfile.data.length} to 24 hours`
            );

            // ถ้ามีข้อมูลมากกว่า 24 ชั่วโมง ตัดให้เหลือ 24 ชั่วโมง
            if (loadProfile.data.length > 24) {
              loadProfile.data = loadProfile.data.slice(0, 24);
            }
            // ถ้ามีน้อยกว่า 24 ชั่วโมง เพิ่มให้ครบ
            else {
              const avgLoad =
                loadProfile.data.reduce(
                  (sum, item) =>
                    sum + (typeof item.load === "number" ? item.load : 0),
                  0
                ) / loadProfile.data.length || 1; // ค่าเฉลี่ยหรือ 1 ถ้าไม่มีข้อมูล

              for (let i = loadProfile.data.length; i < 24; i++) {
                loadProfile.data.push({
                  hour: i,
                  load: avgLoad * (0.7 + Math.random() * 0.6), // สุ่มค่าใกล้เคียงค่าเฉลี่ย
                });
              }
            }
          }

          // ตรวจสอบค่าโหลดในแต่ละชั่วโมง
          for (let i = 0; i < loadProfile.data.length; i++) {
            if (
              typeof loadProfile.data[i].load !== "number" ||
              loadProfile.data[i].load < 0
            ) {
              console.warn(
                `Invalid load value at hour ${i}, setting to default value`
              );
              loadProfile.data[i].load = 1.0; // ค่าเริ่มต้น
            }

            // ตรวจสอบและเพิ่มฟิลด์ hour ถ้าไม่มี
            if (typeof loadProfile.data[i].hour !== "number") {
              loadProfile.data[i].hour = i;
            }
          }

          if (!loadProfile.unit) {
            loadProfile.unit = "kW"; // กำหนดค่าเริ่มต้นหากไม่มี
          }

          // เก็บข้อมูลในตัวแปรระดับโกลบอล
          window.loadProfile = loadProfile;

          // คำนวณค่าสถิติ
          const maxLoad = Math.max(...loadProfile.data.map((d) => d.load));
          const minLoad = Math.min(...loadProfile.data.map((d) => d.load));
          const avgLoad =
            loadProfile.data.reduce((sum, d) => sum + d.load, 0) / 24;
          const totalLoad = loadProfile.data.reduce(
            (sum, d) => sum + d.load,
            0
          );

          // คำนวณช่วงเวลาที่มีโหลดสูง (peak hours)
          const peakThreshold = avgLoad * 1.2; // 120% ของค่าเฉลี่ย
          const peakHours = loadProfile.data
            .map((d, index) => ({ hour: index, load: d.load }))
            .filter((item) => item.load >= peakThreshold)
            .map((item) => item.hour);

          const peakHoursStr =
            peakHours.length > 0
              ? peakHours.map((h) => `${h}:00`).join(", ")
              : "None";

          // แสดงข้อมูลสรุป
          document.getElementById("loadImportSummary").innerHTML = `
      <div class="alert alert-success">
        <h6>Load Profile Summary:</h6>
        <div class="row">
          <div class="col-md-6">
            <ul class="mb-0">
              <li>Peak Load: ${maxLoad.toFixed(2)} ${loadProfile.unit}</li>
              <li>Minimum Load: ${minLoad.toFixed(2)} ${loadProfile.unit}</li>
              <li>Average Load: ${avgLoad.toFixed(2)} ${loadProfile.unit}</li>
            </ul>
          </div>
          <div class="col-md-6">
            <ul class="mb-0">
              <li>Total Daily Load: ${totalLoad.toFixed(2)} ${
            loadProfile.unit
          }h</li>
              <li>Peak Hours: ${peakHoursStr}</li>
              <li>Data Validated: Successfully</li>
            </ul>
          </div>
        </div>
      </div>
    `;

          return true;
        } catch (error) {
          console.error("Error processing load profile:", error);
          document.getElementById("loadImportSummary").innerHTML = `
      <div class="alert alert-danger">
        <h6>Error reading load profile:</h6>
        <p>${error.message}</p>
      </div>
    `;
          return false;
        }
      }

      function updateAreaDetails() {
        if (!window.importedData || !window.importedData.areas) return;

        const areaDetails = document.getElementById("areaDetails");
        const detailsHTML = window.importedData.areas
          .map((area, index) => {
            // คำนวณแฟคเตอร์การผลิตเพิ่มเติม (หน่วย: kWh/kWp/day)
            const yieldFactor =
              area.power && area.power.daily && area.power.peak
                ? (area.power.daily / area.power.peak).toFixed(2)
                : "N/A";

            // คำนวณความหนาแน่นกำลังการผลิต (หน่วย: W/m²)
            const powerDensity =
              area.power && area.power.peak && area.areaSize
                ? ((area.power.peak * 1000) / area.areaSize).toFixed(0)
                : "N/A";

            // การผลิตตามทิศที่หันไป (เทียบกับทิศใต้ในซีกโลกเหนือ หรือทิศเหนือในซีกโลกใต้)
            const optimalOrientation =
              window.importedData.location &&
              window.importedData.location.latitude < 0
                ? "N" // ซีกโลกใต้
                : "S"; // ซีกโลกเหนือ

            const orientationEfficiency =
              area.orientation && area.orientation === optimalOrientation
                ? "100%"
                : area.orientation &&
                  (area.orientation === "E" || area.orientation === "W")
                ? "85-90%"
                : area.orientation &&
                  (area.orientation === "NE" || area.orientation === "NW")
                ? "75-80%"
                : area.orientation &&
                  area.orientation === "N" &&
                  optimalOrientation === "S"
                ? "60-70%"
                : "N/A";

            return `
          <div class="area-detail mb-4">
              <h6 class="border-bottom pb-2">Area ${index + 1}</h6>
              <div class="row">
                  <div class="col-md-4">
                      <table class="table table-sm">
                          <tbody>
                              <tr>
                                  <th>Orientation:</th>
                                  <td>${area.orientation || "N/A"}</td>
                              </tr>
                              <tr>
                                  <th>Angle:</th>
                                  <td>${
                                    area.angle ? area.angle + "°" : "N/A"
                                  }</td>
                              </tr>
                              <tr>
                                  <th>Panel Count:</th>
                                  <td>${area.panelCount || 0}</td>
                              </tr>
                              <tr>
                                  <th>Area Size:</th>
                                  <td>${
                                    area.areaSize
                                      ? area.areaSize.toFixed(2) + " m²"
                                      : "N/A"
                                  }</td>
                              </tr>
                          </tbody>
                      </table>
                  </div>
                  <div class="col-md-4">
                      <table class="table table-sm">
                          <tbody>
                              <tr>
                                  <th>Peak Power:</th>
                                  <td>${
                                    area.power?.peak
                                      ? area.power.peak.toFixed(2) + " kW"
                                      : "N/A"
                                  }</td>
                              </tr>
                              <tr>
                                  <th>Daily Production:</th>
                                  <td>${
                                    area.power?.daily
                                      ? area.power.daily.toFixed(2) + " kWh"
                                      : "N/A"
                                  }</td>
                              </tr>
                              <tr>
                                  <th>Monthly Production:</th>
                                  <td>${
                                    area.power?.monthly
                                      ? area.power.monthly.toFixed(2) + " kWh"
                                      : "N/A"
                                  }</td>
                              </tr>
                              <tr>
                                  <th>Yearly Production:</th>
                                  <td>${
                                    area.power?.yearly
                                      ? area.power.yearly.toFixed(2) + " kWh"
                                      : "N/A"
                                  }</td>
                              </tr>
                          </tbody>
                      </table>
                  </div>
                  <div class="col-md-4">
                      <table class="table table-sm">
                          <tbody>
                              <tr>
                                  <th>Production Yield:</th>
                                  <td>${yieldFactor} kWh/kWp/day</td>
                              </tr>
                              <tr>
                                  <th>Power Density:</th>
                                  <td>${powerDensity} W/m²</td>
                              </tr>
                              <tr>
                                  <th>Orientation Efficiency:</th>
                                  <td>${orientationEfficiency}</td>
                              </tr>
                              <tr>
                                  <th>Panel Type:</th>
                                  <td>${area.panelType || "Standard"}</td>
                              </tr>
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      `;
          })
          .join("");

        areaDetails.innerHTML = detailsHTML;
      }

      function toggleBatteryInput() {
        const useInitialBattery = document.getElementById("useInitialBattery");
        const initialBatteryPercent = document.getElementById(
          "initialBatteryPercent"
        );
        initialBatteryPercent.disabled = !useInitialBattery.checked;

        // Reset to 0 when unchecked
        if (!useInitialBattery.checked) {
          initialBatteryPercent.value = "0";
        }
      }

      async function handleFileUpload(input) {
        try {
          const file = input.files[0];
          if (!file) {
            throw new Error("No file selected");
          }

          document.getElementById("fileName").textContent = file.name;

          // ตรวจสอบนามสกุลไฟล์
          if (!file.name.toLowerCase().endsWith(".json")) {
            throw new Error("Invalid file format. Please select a JSON file.");
          }

          // อ่านและแปลงเป็น JSON
          const text = await file.text();
          let importedData;

          try {
            importedData = JSON.parse(text);
          } catch (e) {
            throw new Error("Invalid JSON format: " + e.message);
          }

          // ตรวจสอบและซ่อมแซมโครงสร้างข้อมูล
          if (!importedData.areas) {
            console.warn("Missing 'areas' array, creating empty array");
            importedData.areas = [];
          }

          if (!Array.isArray(importedData.areas)) {
            console.warn("'areas' is not an array, converting to array");
            importedData.areas = [importedData.areas].filter(Boolean);
          }

          // ถ้าไม่มีข้อมูลพื้นที่ แสดงคำเตือนแทนการโยน error
          if (importedData.areas.length === 0) {
            document.getElementById("importSummary").innerHTML = `
        <div class="alert alert-warning">
          <h6>Warning:</h6>
          <p>The uploaded file does not contain any installation areas. Please choose a valid file with solar installation data.</p>
        </div>
      `;
            return false;
          }

          // ตรวจสอบว่าแต่ละพื้นที่มีข้อมูลที่จำเป็น
          for (let i = 0; i < importedData.areas.length; i++) {
            const area = importedData.areas[i];

            // ตรวจสอบและซ่อมแซมข้อมูล shape
            if (
              !area.shape ||
              !area.shape.path ||
              !Array.isArray(area.shape.path)
            ) {
              console.warn(
                `Area ${i + 1} has invalid path data, creating default path`
              );
              area.shape = {
                path: [
                  {
                    lat: 13.755 + Math.random() * 0.01,
                    lng: 100.501 + Math.random() * 0.01,
                  },
                  {
                    lat: 13.755 + Math.random() * 0.01,
                    lng: 100.502 + Math.random() * 0.01,
                  },
                  {
                    lat: 13.756 + Math.random() * 0.01,
                    lng: 100.502 + Math.random() * 0.01,
                  },
                  {
                    lat: 13.756 + Math.random() * 0.01,
                    lng: 100.501 + Math.random() * 0.01,
                  },
                ],
              };
            }

            // ตรวจสอบและซ่อมแซมข้อมูล panelCount
            if (!area.panelCount || area.panelCount <= 0) {
              console.warn(
                `Area ${i + 1} has invalid panel count, setting default value`
              );
              area.panelCount = 10 + Math.floor(Math.random() * 20);
            }

            // ตรวจสอบและซ่อมแซมข้อมูล power
            if (
              !area.power ||
              typeof area.power.peak !== "number" ||
              area.power.peak <= 0
            ) {
              console.warn(
                `Area ${i + 1} has invalid power data, calculating defaults`
              );
              const panelSpec = PANEL_SPECS[area.selectedPanelIndex || 0];
              area.power = {
                peak: panelSpec.capacity * area.panelCount,
                daily: panelSpec.capacity * area.panelCount * 4.5,
                monthly: panelSpec.capacity * area.panelCount * 4.5 * 30,
                yearly: panelSpec.capacity * area.panelCount * 4.5 * 365,
              };
            }

            // ตรวจสอบและซ่อมแซมข้อมูล areaSize
            if (!area.areaSize || area.areaSize <= 0) {
              console.warn(
                `Area ${
                  i + 1
                } has invalid area size, calculating from panel count`
              );
              const panelSpec = PANEL_SPECS[area.selectedPanelIndex || 0];
              area.areaSize =
                panelSpec.width * panelSpec.height * area.panelCount;
            }
          }

          // เก็บข้อมูลในตัวแปรระดับโกลบอล
          window.importedData = importedData;

          // คำนวณจุดศูนย์กลาง
          const centerPoint = calculateCenterPoint(importedData.areas);

          // คำนวณกำลังการผลิตทั้งหมด
          const totalPower = importedData.areas.reduce(
            (sum, area) => sum + area.power.peak,
            0
          );

          // อัพเดทฟอร์ม
          document.getElementById("latitude").value = centerPoint.lat;
          document.getElementById("longitude").value = centerPoint.lng;
          document.getElementById("ratedPower").value = totalPower.toFixed(2);

          // คำนวณพื้นที่ติดตั้งทั้งหมด
          const totalArea = importedData.areas.reduce(
            (sum, area) => sum + (area.areaSize || 0),
            0
          );

          // คำนวณประสิทธิภาพการผลิต (kWp/m²)
          const efficiency =
            totalArea > 0 ? (totalPower / totalArea).toFixed(3) : "N/A";

          // แสดงข้อมูลสรุป
          document.getElementById("importSummary").innerHTML = `
      <div class="alert alert-success">
        <h6>Import Summary:</h6>
        <div class="row">
          <div class="col-md-6">
            <ul class="mb-0">
              <li>Areas: ${importedData.areas.length}</li>
              <li>Total Panels: ${importedData.areas.reduce(
                (sum, area) => sum + area.panelCount,
                0
              )}</li>
              <li>Total Power: ${totalPower.toFixed(2)} kWp</li>
              <li>Location: ${centerPoint.lat}, ${centerPoint.lng}</li>
            </ul>
          </div>
          <div class="col-md-6">
            <ul class="mb-0">
              <li>Total Installation Area: ${totalArea.toFixed(2)} m²</li>
              <li>Power Density: ${efficiency} kWp/m²</li>
              <li>Data Validated: Successfully</li>
            </ul>
          </div>
        </div>
      </div>
    `;

          // อัพเดทรายละเอียดพื้นที่
          updateAreaDetails();

          return true;
        } catch (error) {
          console.error("Error processing file:", error);
          document.getElementById("importSummary").innerHTML = `
      <div class="alert alert-danger">
        <h6>Error reading file:</h6>
        <p>${error.message}</p>
      </div>
    `;
          return false;
        }
      }

      function calculateCenterPoint(areas) {
        let totalLat = 0;
        let totalLng = 0;
        let pointCount = 0;

        // Loop through each area and its path points
        areas.forEach((area) => {
          area.shape.path.forEach((point) => {
            totalLat += point.lat;
            totalLng += point.lng;
            pointCount++;
          });
        });

        // Calculate average coordinates
        const centerLat = totalLat / pointCount;
        const centerLng = totalLng / pointCount;

        // Return formatted coordinates
        return {
          lat: centerLat.toFixed(6),
          lng: centerLng.toFixed(6),
        };
      }

      async function startSimulation() {
        try {
          // สร้าง progress indicator
          const formElement = document.getElementById("solarForm");
          const progressDiv = document.createElement("div");
          progressDiv.id = "simulation-progress";
          progressDiv.className = "mt-3";
          progressDiv.innerHTML = `
      <div class="alert alert-info">
        <div class="d-flex align-items-center">
          <div class="spinner-border spinner-border-sm me-2" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <div>Running simulation...</div>
        </div>
      </div>
    `;
          formElement.appendChild(progressDiv);

          // ตรวจสอบข้อมูลนำเข้า
          if (!window.importedData) {
            throw new Error("Please import solar installation data first");
          }

          if (!window.loadProfile) {
            throw new Error("Please import load profile data first");
          }

          // ดึงค่าพารามิเตอร์จาก UI
          const date = document.getElementById("date").value;
          if (!date) {
            throw new Error("Please select a date");
          }

          const latitudeElement = document.getElementById("latitude");
          const longitudeElement = document.getElementById("longitude");

          if (!latitudeElement || !longitudeElement) {
            throw new Error("Latitude or longitude input fields not found");
          }

          const latitudeValue = latitudeElement.value;
          const longitudeValue = longitudeElement.value;

          if (!latitudeValue || !longitudeValue) {
            throw new Error(
              "Latitude and longitude values are required. Please import solar installation data."
            );
          }

          const latitude = parseFloat(latitudeValue);
          const longitude = parseFloat(longitudeValue);

          // ตรวจสอบว่าค่าพิกัดอยู่ในช่วงที่ถูกต้อง
          if (isNaN(latitude) || latitude < -90 || latitude > 90) {
            throw new Error(
              `Invalid latitude value: ${latitudeValue}. Latitude must be between -90 and 90.`
            );
          }

          if (isNaN(longitude) || longitude < -180 || longitude > 180) {
            throw new Error(
              `Invalid longitude value: ${longitudeValue}. Longitude must be between -180 and 180.`
            );
          }

          const ratedPowerElement = document.getElementById("ratedPower");
          if (!ratedPowerElement) {
            throw new Error("Rated power input field not found");
          }

          const ratedPowerValue = ratedPowerElement.value;
          if (!ratedPowerValue) {
            throw new Error(
              "Total rated power is required. Please import valid solar installation data."
            );
          }

          const totalCapacity = parseFloat(ratedPowerValue);
          if (isNaN(totalCapacity) || totalCapacity <= 0) {
            throw new Error(
              `Invalid total capacity: ${ratedPowerValue}. Value must be a positive number.`
            );
          }

          const hasBattery = document.getElementById("hasBattery").checked;
          const isGridConnected =
            document.getElementById("gridConnected").checked;

          // สร้างอินสแตนซ์ของระบบ
          let battery = null;
          if (hasBattery) {
            const batteryCapacityElement =
              document.getElementById("batteryCapacity");
            const chargeRateElement = document.getElementById("chargeRate");
            const useInitialBatteryElement =
              document.getElementById("useInitialBattery");
            const initialBatteryPercentElement = document.getElementById(
              "initialBatteryPercent"
            );

            if (
              !batteryCapacityElement ||
              !chargeRateElement ||
              !useInitialBatteryElement ||
              !initialBatteryPercentElement
            ) {
              throw new Error("Battery input fields not found");
            }

            const batteryCapacity = parseFloat(batteryCapacityElement.value);
            const chargeRate = parseFloat(chargeRateElement.value);
            const useInitialBattery = useInitialBatteryElement.checked;
            const initialBatteryPercent = useInitialBattery
              ? parseFloat(initialBatteryPercentElement.value)
              : 0;

            if (isNaN(batteryCapacity) || batteryCapacity <= 0) {
              throw new Error(
                `Invalid battery capacity: ${batteryCapacityElement.value}. Value must be a positive number.`
              );
            }

            if (isNaN(chargeRate) || chargeRate <= 0 || chargeRate > 2) {
              throw new Error(
                `Invalid charge rate: ${chargeRateElement.value}. Value must be between 0 and 2.`
              );
            }

            if (
              useInitialBattery &&
              (isNaN(initialBatteryPercent) ||
                initialBatteryPercent < 0 ||
                initialBatteryPercent > 100)
            ) {
              throw new Error(
                `Invalid initial battery percentage: ${initialBatteryPercentElement.value}. Value must be between 0 and 100.`
              );
            }

            battery = new BatteryManager(
              batteryCapacity,
              chargeRate,
              initialBatteryPercent
            );
          }

          // สร้างอินสแตนซ์ GridManager
          const grid = new GridManager();

          // เตรียมพารามิเตอร์สำหรับการจำลอง
          const solarData = {
            latitude,
            longitude,
            totalCapacity,
          };

          console.log("Starting simulation with parameters:", {
            date,
            solarData,
            loadProfile: window.loadProfile
              ? {
                  dataLength: window.loadProfile.data.length,
                  unit: window.loadProfile.unit,
                }
              : null,
            hasBattery,
            isGridConnected,
          });

          // เริ่มการจำลอง
          const results = await simulateSystem(
            date,
            solarData,
            window.loadProfile,
            battery,
            grid
          );

          // อัพเดทการแสดงผล
          updateCharts(
            results.solarProduction,
            results.batteryStatus,
            window.loadProfile.data,
            results.gridStatus,
            results.solarIrradiance
          );

          updateAreaDetails();

          // ลบ progress indicator
          const progressElement = document.getElementById(
            "simulation-progress"
          );
          if (progressElement) {
            progressElement.remove();
          }

          // เพิ่มข้อความแจ้งเตือนความสำเร็จ
          const successDiv = document.createElement("div");
          successDiv.id = "simulation-success";
          successDiv.className = "mt-3";
          successDiv.innerHTML = `
      <div class="alert alert-success">
        <div class="d-flex align-items-center">
          <i class="bi bi-check-circle-fill me-2"></i>
          <div>Simulation completed successfully</div>
        </div>
      </div>
    `;
          formElement.appendChild(successDiv);

          // ลบข้อความความสำเร็จหลังจาก 3 วินาที
          setTimeout(() => {
            const successElement =
              document.getElementById("simulation-success");
            if (successElement) {
              successElement.remove();
            }
          }, 3000);

          return results;
        } catch (error) {
          console.error("Simulation error:", error);

          // ลบ progress indicator
          const progressElement = document.getElementById(
            "simulation-progress"
          );
          if (progressElement) {
            progressElement.remove();
          }

          // ลบข้อความข้อผิดพลาดเดิม (ถ้ามี)
          const oldErrorElement = document.getElementById("simulation-error");
          if (oldErrorElement) {
            oldErrorElement.remove();
          }

          // แสดงข้อความข้อผิดพลาด
          const formElement = document.getElementById("solarForm");
          const errorDiv = document.createElement("div");
          errorDiv.id = "simulation-error";
          errorDiv.className = "mt-3";
          errorDiv.innerHTML = `
      <div class="alert alert-danger">
        <div class="d-flex align-items-center">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          <div>Error running simulation: ${error.message}</div>
        </div>
      </div>
    `;
          formElement.appendChild(errorDiv);

          // ลบข้อความข้อผิดพลาดหลังจาก 8 วินาที
          setTimeout(() => {
            const errorElement = document.getElementById("simulation-error");
            if (errorElement) {
              errorElement.remove();
            }
          }, 8000);

          throw error;
        }
      }

      function handleError(message, elementId = null) {
        console.error("Error:", message);

        if (elementId) {
          const element = document.getElementById(elementId);
          if (element) {
            element.innerHTML = `
        <div class="alert alert-danger">
          <div class="d-flex align-items-center">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            <div>${message}</div>
          </div>
        </div>
      `;
          }
        } else {
          alert(message);
        }
      }

      function validateInputs() {
        const validationErrors = [];

        // ตรวจสอบข้อมูลระบบโซล่าร์
        if (!window.importedData) {
          validationErrors.push("Please import solar installation data");
        }

        // ตรวจสอบข้อมูลโหลด
        if (!window.loadProfile) {
          validationErrors.push("Please import load profile data");
        }

        // ตรวจสอบวันที่
        const dateInput = document.getElementById("date");
        if (!dateInput.value) {
          validationErrors.push("Please select a date");
        }

        // ตรวจสอบพิกัด
        const latitude = parseFloat(document.getElementById("latitude").value);
        const longitude = parseFloat(
          document.getElementById("longitude").value
        );

        if (isNaN(latitude) || latitude < -90 || latitude > 90) {
          validationErrors.push(
            "Invalid latitude (must be between -90 and 90)"
          );
        }

        if (isNaN(longitude) || longitude < -180 || longitude > 180) {
          validationErrors.push(
            "Invalid longitude (must be between -180 and 180)"
          );
        }

        // ตรวจสอบค่าพลังงาน
        const totalCapacity = parseFloat(
          document.getElementById("ratedPower").value
        );
        if (isNaN(totalCapacity) || totalCapacity <= 0) {
          validationErrors.push("Invalid total rated power");
        }

        // ตรวจสอบพารามิเตอร์แบตเตอรี่ (ถ้ามี)
        if (document.getElementById("hasBattery").checked) {
          const batteryCapacity = parseFloat(
            document.getElementById("batteryCapacity").value
          );
          const chargeRate = parseFloat(
            document.getElementById("chargeRate").value
          );
          const minBatteryLevel = parseFloat(
            document.getElementById("minBatteryLevel").value
          );

          if (isNaN(batteryCapacity) || batteryCapacity <= 0) {
            validationErrors.push("Invalid battery capacity");
          }

          if (isNaN(chargeRate) || chargeRate <= 0 || chargeRate > 2) {
            validationErrors.push(
              "Invalid charge rate (must be between 0 and 2)"
            );
          }

          if (
            isNaN(minBatteryLevel) ||
            minBatteryLevel < 0 ||
            minBatteryLevel > 50
          ) {
            validationErrors.push(
              "Invalid minimum battery level (must be between 0 and 50%)"
            );
          }

          if (document.getElementById("useInitialBattery").checked) {
            const initialBatteryPercent = parseFloat(
              document.getElementById("initialBatteryPercent").value
            );
            if (
              isNaN(initialBatteryPercent) ||
              initialBatteryPercent < 0 ||
              initialBatteryPercent > 100
            ) {
              validationErrors.push(
                "Invalid initial battery percentage (must be between 0 and 100%)"
              );
            }
          }
        }

        return validationErrors;
      }

      function createSampleData() {
        // ตัวอย่างข้อมูลการติดตั้งโซล่าเซลล์
        const sampleSolarData = {
          areas: [
            {
              shape: {
                path: [
                  { lat: 13.756331, lng: 100.501762 },
                  { lat: 13.756331, lng: 100.502762 },
                  { lat: 13.755331, lng: 100.502762 },
                  { lat: 13.755331, lng: 100.501762 },
                ],
              },
              orientation: "S",
              angle: 15,
              panelCount: 20,
              selectedPanelIndex: 0,
              areaSize: 40,
              power: {
                peak: 6.4,
                daily: 25.6,
                monthly: 768,
                yearly: 9125,
              },
              panelType: "Mono",
            },
          ],
        };

        // ตัวอย่างข้อมูลโหลดไฟฟ้า
        const sampleLoadData = {
          data: [
            { hour: 0, load: 0.8 },
            { hour: 1, load: 0.7 },
            { hour: 2, load: 0.6 },
            { hour: 3, load: 0.5 },
            { hour: 4, load: 0.5 },
            { hour: 5, load: 0.6 },
            { hour: 6, load: 1.0 },
            { hour: 7, load: 1.5 },
            { hour: 8, load: 2.5 },
            { hour: 9, load: 3.5 },
            { hour: 10, load: 4.0 },
            { hour: 11, load: 4.5 },
            { hour: 12, load: 4.0 },
            { hour: 13, load: 3.5 },
            { hour: 14, load: 3.0 },
            { hour: 15, load: 3.5 },
            { hour: 16, load: 4.0 },
            { hour: 17, load: 4.5 },
            { hour: 18, load: 5.0 },
            { hour: 19, load: 4.5 },
            { hour: 20, load: 3.5 },
            { hour: 21, load: 2.5 },
            { hour: 22, load: 1.5 },
            { hour: 23, load: 1.0 },
          ],
          unit: "kW",
        };

        // บันทึกข้อมูลตัวอย่าง
        window.importedData = sampleSolarData;
        window.loadProfile = sampleLoadData;

        // อัพเดทฟอร์ม
        document.getElementById("latitude").value = "13.755831";
        document.getElementById("longitude").value = "100.502262";
        document.getElementById("ratedPower").value = "6.4";

        // แสดงข้อมูลสรุป
        document.getElementById("importSummary").innerHTML = `
    <div class="alert alert-success">
      <h6>Sample Data Loaded:</h6>
      <div class="row">
        <div class="col-md-6">
          <ul class="mb-0">
            <li>Areas: 1</li>
            <li>Total Panels: 20</li>
            <li>Total Power: 6.40 kWp</li>
            <li>Location: 13.755831, 100.502262</li>
          </ul>
        </div>
        <div class="col-md-6">
          <ul class="mb-0">
            <li>Total Installation Area: 40.00 m²</li>
            <li>Power Density: 0.160 kWp/m²</li>
            <li>Data Type: Sample data for testing</li>
          </ul>
        </div>
      </div>
    </div>
  `;

        document.getElementById("loadImportSummary").innerHTML = `
    <div class="alert alert-success">
      <h6>Sample Load Profile Loaded:</h6>
      <div class="row">
        <div class="col-md-6">
          <ul class="mb-0">
            <li>Peak Load: 5.00 kW</li>
            <li>Minimum Load: 0.50 kW</li>
            <li>Average Load: 2.25 kW</li>
          </ul>
        </div>
        <div class="col-md-6">
          <ul class="mb-0">
            <li>Total Daily Load: 54.00 kWh</li>
            <li>Peak Hours: 12:00, 13:00, 14:00</li>
            <li>Data Type: Sample data for testing</li>
          </ul>
        </div>
      </div>
    </div>
  `;

        // อัพเดทชื่อไฟล์
        document.getElementById("fileName").textContent =
          "sample_solar_data.json";
        document.getElementById("loadFileName").textContent =
          "sample_load_profile.json";

        // อัพเดทรายละเอียดพื้นที่
        updateAreaDetails();

        return true;
      }
      // เพิ่มปุ่มในหน้าจอสำหรับโหลดข้อมูลตัวอย่าง
      document.addEventListener("DOMContentLoaded", function () {
        const importSection = document.querySelector(".card-body");
        if (importSection) {
          const loadSampleButton = document.createElement("button");
          loadSampleButton.type = "button";
          loadSampleButton.className = "btn btn-outline-secondary ms-2";
          loadSampleButton.textContent = "Load Sample Data";
          loadSampleButton.onclick = createSampleData;

          const fileUploadLabel = document.querySelector(".upload-btn");
          if (fileUploadLabel && fileUploadLabel.parentNode) {
            fileUploadLabel.parentNode.appendChild(loadSampleButton);
          }
        }
      });

      function saveSimulationResults(results) {
        try {
          // สร้างออบเจ็กต์สำหรับบันทึก
          const simulationData = {
            date: document.getElementById("date").value,
            location: {
              latitude: parseFloat(document.getElementById("latitude").value),
              longitude: parseFloat(document.getElementById("longitude").value),
            },
            system: {
              totalCapacity: parseFloat(
                document.getElementById("ratedPower").value
              ),
              hasBattery: document.getElementById("hasBattery").checked,
              gridConnected: document.getElementById("gridConnected").checked,
            },
            results: {
              solarProduction: results.solarProduction,
              solarIrradiance: results.solarIrradiance,
              batteryStatus: results.batteryStatus,
              gridStatus: results.gridStatus.map((status) => ({
                voltage: status.voltage,
                frequency: status.frequency,
                currentGridImport: status.currentGridImport,
                currentGridExport: status.currentGridExport,
              })),
            },
            summary: {
              totalSolarProduction: results.solarProduction.reduce(
                (a, b) => a + b,
                0
              ),
              totalGridImport: results.gridStatus.reduce(
                (a, s) => a + (s.currentGridImport || 0),
                0
              ),
              totalGridExport: results.gridStatus.reduce(
                (a, s) => a + (s.currentGridExport || 0),
                0
              ),
            },
          };

          // แปลงเป็น JSON string
          const jsonData = JSON.stringify(simulationData, null, 2);

          // สร้าง blob และ URL
          const blob = new Blob([jsonData], { type: "application/json" });
          const url = URL.createObjectURL(blob);

          // สร้างลิงก์ดาวน์โหลด
          const a = document.createElement("a");
          a.href = url;
          a.download = `solar-simulation-${simulationData.date}.json`;

          // เพิ่มลิงก์ลงใน DOM และคลิก
          document.body.appendChild(a);
          a.click();

          // ลบลิงก์และ URL
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 0);

          return true;
        } catch (error) {
          console.error("Error saving simulation results:", error);
          alert("Error saving simulation results: " + error.message);
          return false;
        }
      }

      function toggleBatteryInputs(hasBattery) {
        const batteryInputs = document.querySelectorAll(".battery-input");
        batteryInputs.forEach((input) => {
          input.disabled = !hasBattery;
        });

        if (hasBattery) {
          document.getElementById("batteryCapacity").value = "35";
          document.getElementById("chargeRate").value = "0.5";
          document.getElementById("useInitialBattery").checked = false;
          document.getElementById("initialBatteryPercent").value = "0";
          document.getElementById("minBatteryLevel").value = "20";
          document.getElementById("allowGridCharge").checked = false;
          document.getElementById("initialBatteryPercent").disabled = true;
        } else {
          document.getElementById("batteryCapacity").value = "0";
          document.getElementById("chargeRate").value = "0.5";
          document.getElementById("useInitialBattery").checked = false;
          document.getElementById("initialBatteryPercent").value = "0";
          document.getElementById("minBatteryLevel").value = "20";
          document.getElementById("allowGridCharge").checked = false;
        }
      }

      async function getNASAData(lat, lng, dateStr) {
        try {
          // แปลง date string เป็น Date object
          const date = new Date(dateStr);

          // คำนวณวันที่ของปี (1-365)
          const start = new Date(date.getFullYear(), 0, 0);
          const diff = date - start;
          const dayOfYear = Math.floor(diff / 86400000);

          const month = date.getMonth();
          const latitudeRad = lat * (Math.PI / 180);

          // คำนวณมุมเดคลิเนชัน (ค่าเอียงของโลก)
          const declination =
            23.45 * Math.sin((360 / 365) * (dayOfYear - 81) * (Math.PI / 180));
          const declinationRad = declination * (Math.PI / 180);

          // ค่าพารามิเตอร์พื้นฐาน
          const solarConstant = 1361; // ค่า NASA ล่าสุด (W/m²)

          // ปรับค่าทรานสมิตแตนซ์ตามละติจูด (ความโปร่งใสของบรรยากาศ)
          const baseTransmittance = 0.7;
          const atmosphericTransmittance =
            baseTransmittance - (Math.abs(lat) / 90) * 0.1;

          // ปรับค่าเมฆปกคลุมตามฤดูกาลและเดือน
          const seasonalCloudiness = [
            [
              0.75, 0.78, 0.82, 0.85, 0.88, 0.9, 0.9, 0.88, 0.85, 0.82, 0.78,
              0.75,
            ], // Northern hemisphere
            [
              0.9, 0.88, 0.85, 0.82, 0.78, 0.75, 0.75, 0.78, 0.82, 0.85, 0.88,
              0.9,
            ], // Southern hemisphere
          ];

          // เลือกข้อมูลเมฆตามซีกโลก
          const hemisphereIndex = lat >= 0 ? 0 : 1;
          const cloudiness = seasonalCloudiness[hemisphereIndex][month];

          // คำนวณมุมความสูงดวงอาทิตย์ที่เที่ยงวัน (solar noon)
          const solarNoonElevation = 90 - Math.abs(lat - declination);
          const solarNoonElevationRad = solarNoonElevation * (Math.PI / 180);

          // คำนวณระยะทางเฉลี่ยโลก-ดวงอาทิตย์ตามฤดูกาล
          const earthSunDistance =
            1 + 0.033 * Math.cos((360 / 365) * dayOfYear * (Math.PI / 180));

          // คำนวณรังสีตรงเฉลี่ยรายวัน (ค่าพลังงานแสงอาทิตย์ทั้งวัน)
          let dailyIrradiance =
            (solarConstant *
              Math.sin(solarNoonElevationRad) *
              atmosphericTransmittance *
              cloudiness) /
            (earthSunDistance * earthSunDistance);

          // ปรับแต่งตามฤดูกาล
          const seasonalFactor =
            1 + 0.033 * Math.cos((360 / 365) * dayOfYear * (Math.PI / 180));

          // ปัจจัยรายเดือน (ค่าเฉลี่ยจากข้อมูลจริง)
          const monthlyFactors = [
            0.85, // January
            0.87, // February
            0.9, // March
            0.93, // April
            0.95, // May
            0.97, // June
            0.97, // July
            0.95, // August
            0.92, // September
            0.89, // October
            0.86, // November
            0.84, // December
          ];

          dailyIrradiance *= seasonalFactor * monthlyFactors[month];

          // แปลงเป็นค่าพลังงานรายวัน (Wh/m²/day)
          dailyIrradiance *= (solarNoonElevation / 30) * 3; // ปรับตามจำนวนชั่วโมงที่มีแสงแดดเฉลี่ย

          // กำหนดขอบเขตค่าที่สมเหตุสมผลตามละติจูด
          const minIrradiance = 1000 + Math.abs(lat) * 5; // ค่าต่ำสุดที่เป็นไปได้
          const maxIrradiance = 8000 - Math.abs(lat) * 25; // ค่าสูงสุดที่เป็นไปได้

          return Math.max(
            minIrradiance,
            Math.min(dailyIrradiance, maxIrradiance)
          );
        } catch (error) {
          console.error("Error in solar calculations:", error);
          return 3000; // ค่าเฉลี่ยกรณีมีข้อผิดพลาด
        }
      }

      function calculateHourlyIrradiance(dailyIrradiance) {
        // คำนวณเวลาพระอาทิตย์ขึ้นและตกโดยประมาณ
        const sunrise = 6; // 6:00 AM
        const sunset = 18; // 6:00 PM
        const dayLength = sunset - sunrise;
        const hours = Array.from({ length: 24 }, (_, i) => i);

        // ค่าเฉลี่ยสูงสุดของความเข้มแสงเป็น W/m²
        const peakIrradiance = dailyIrradiance / (0.5 * dayLength);

        return hours.map((hour) => {
          // เวลากลางคืน ไม่มีแสงอาทิตย์
          if (hour < sunrise || hour >= sunset) {
            return 0;
          }

          // ปรับเป็นชั่วโมงปกติ (0-12 hours since sunrise)
          const hoursSinceSunrise = hour - sunrise;

          // แบบจำลองเส้นโค้งแบบ bell curve สำหรับความเข้มแสงในแต่ละชั่วโมง
          // โดยใช้ฟังก์ชัน sine เพื่อให้ได้เส้นโค้งธรรมชาติ
          const normalizedHour = hoursSinceSunrise / dayLength;

          // ค่า coefficient ปรับความเข้ม
          const distributionFactor = Math.sin(normalizedHour * Math.PI);

          // ปัจจัยความแปรปรวนของเมฆ (ความแปรปรวน ±10%)
          const cloudVariability = 0.9 + Math.random() * 0.2;

          // คำนวณความเข้มแสงในชั่วโมงนั้น
          const hourlyIrradiance =
            peakIrradiance * distributionFactor * cloudVariability;

          return Math.max(0, hourlyIrradiance);
        });
      }

      function calculateHourlyIrradiance(dailyIrradiance) {
        // คำนวณเวลาพระอาทิตย์ขึ้นและตกโดยประมาณ
        const sunrise = 6; // 6:00 AM
        const sunset = 18; // 6:00 PM
        const dayLength = sunset - sunrise;
        const hours = Array.from({ length: 24 }, (_, i) => i);

        // ค่าเฉลี่ยสูงสุดของความเข้มแสงเป็น W/m²
        const peakIrradiance = dailyIrradiance / (0.5 * dayLength);

        return hours.map((hour) => {
          // เวลากลางคืน ไม่มีแสงอาทิตย์
          if (hour < sunrise || hour >= sunset) {
            return 0;
          }

          // ปรับเป็นชั่วโมงปกติ (0-12 hours since sunrise)
          const hoursSinceSunrise = hour - sunrise;

          // แบบจำลองเส้นโค้งแบบ bell curve สำหรับความเข้มแสงในแต่ละชั่วโมง
          // โดยใช้ฟังก์ชัน sine เพื่อให้ได้เส้นโค้งธรรมชาติ
          const normalizedHour = hoursSinceSunrise / dayLength;

          // ค่า coefficient ปรับความเข้ม
          const distributionFactor = Math.sin(normalizedHour * Math.PI);

          // ปัจจัยความแปรปรวนของเมฆ (ความแปรปรวน ±10%)
          const cloudVariability = 0.9 + Math.random() * 0.2;

          // คำนวณความเข้มแสงในชั่วโมงนั้น
          const hourlyIrradiance =
            peakIrradiance * distributionFactor * cloudVariability;

          return Math.max(0, hourlyIrradiance);
        });
      }

      function calculateHourlyIrradiance(dailyIrradiance) {
        // ตัวอย่างของเดิม
        const hours = Array.from({ length: 24 }, (_, i) => i);
        const sunrise = 6,
          sunset = 18;
        const peakHour = (sunrise + sunset) / 2;
        const dayLength = sunset - sunrise;
        return hours.map((hour) => {
          if (hour < sunrise || hour > sunset) return 0;
          const normalizedHour = (hour - sunrise) / dayLength;
          const sineFactor = Math.sin(normalizedHour * Math.PI);
          const gaussianFactor = Math.exp(
            -Math.pow((hour - peakHour) / (dayLength / 4), 2)
          );
          const distributionFactor = (sineFactor + gaussianFactor) / 2;
          const cloudFactor = 0.9 + Math.random() * 0.2;
          return Math.max(
            0,
            dailyIrradiance * distributionFactor * 0.95 * cloudFactor
          );
        });
      }

      class BatteryManager {
        constructor(capacity, chargeRate, initialSoC = 70) {
          this.capacity = capacity; // ความจุแบตเตอรี่ (kWh)
          this.maxChargeRate = chargeRate; // C-rate
          this.stateOfCharge = initialSoC; // % ของความจุเต็ม (0-100%)
          this.currentPower = 0; // กำลังไฟฟ้าปัจจุบัน (kW) - บวกคือจ่าย, ลบคือชาร์จ
          this.chargeEfficiency = 0.95; // ประสิทธิภาพการชาร์จ (95%)
          this.dischargeEfficiency = 0.95; // ประสิทธิภาพการจ่าย (95%)
          this.minSoC =
            parseFloat(document.getElementById("minBatteryLevel").value) || 20; // ขีดจำกัดต่ำสุด (%)
          this.maxSoC = 95; // ขีดจำกัดสูงสุด (%) เพื่อป้องกันการชาร์จเกิน
          this.maxDischargePower = capacity * chargeRate; // กำลังไฟสูงสุดที่จ่ายได้ (kW)
          this.maxChargePower = capacity * chargeRate; // กำลังไฟสูงสุดที่รับได้ (kW)
          this.chargingStage = "IDLE";
          this.temperature = 25; // อุณหภูมิเริ่มต้น (°C)
          this.healthStatus = 100; // สถานะสุขภาพแบตเตอรี่ (%)
          this.cycleCount = 0; // จำนวนรอบการชาร์จ
          this.energyIn = 0; // พลังงานสะสมที่ชาร์จเข้า (kWh)
          this.energyOut = 0; // พลังงานสะสมที่จ่ายออก (kWh)
          this.allowGridCharge =
            document.getElementById("allowGridCharge")?.checked || false;
          this.temperatureCoefficient = -0.003; // ค่าสัมประสิทธิ์อุณหภูมิต่อประสิทธิภาพ

          // เพิ่มค่าสำหรับการวิเคราะห์
          this.costSaved = 0; // เงินที่ประหยัดได้จากการใช้แบตเตอรี่
          this.lastChargeSource = "NONE"; // แหล่งพลังงานล่าสุดที่ใช้ชาร์จ (GRID/SOLAR/NONE)
        }

        calculateMaxChargePower() {
          // ปรับลดกำลังชาร์จเมื่อ SoC สูง (CC-CV charging)
          if (this.stateOfCharge >= 80) {
            return this.maxChargePower * (1 - (this.stateOfCharge - 80) / 20);
          }
          return this.maxChargePower;
        }

        calculateMaxDischargePower() {
          // ปรับลดกำลังจ่ายตามสถานะแบตเตอรี่
          const tempFactor =
            1 + this.temperatureCoefficient * (this.temperature - 25);

          // ลดกำลังจ่ายเมื่อ SoC ต่ำ
          const socFactor =
            (this.stateOfCharge - this.minSoC) / (100 - this.minSoC);

          // ลดกำลังจ่ายตามสุขภาพแบตเตอรี่
          const healthFactor = this.healthStatus / 100;

          return this.maxDischargePower * tempFactor * socFactor * healthFactor;
        }

        // คำนวณประสิทธิภาพรวมของแบตเตอรี่
        getEfficiency() {
          if (this.energyOut === 0) return 100;
          return (this.energyOut / this.energyIn) * 100;
        }

        // คำนวณค่าเสื่อมราคาต่อ kWh
        getCostPerCycle() {
          // สมมติว่าแบตเตอรี่มีอายุ 2,000 รอบที่ DoD 80%
          const totalCycles = 2000;
          const batteryPrice = this.capacity * 10000; // สมมติว่าราคาแบตเตอรี่ 10,000 บาทต่อ kWh
          return batteryPrice / (totalCycles * this.capacity * 0.8);
        }

        charge(availablePower, isFromGrid = false) {
          // ตรวจสอบว่าอนุญาตให้ชาร์จจากกริดหรือไม่
          if (isFromGrid && !this.allowGridCharge) return 0;

          // ถ้าแบตเตอรี่เต็มแล้ว จะไม่รับการชาร์จอีก
          if (this.stateOfCharge >= this.maxSoC) return 0;

          // คำนวณพลังงานสูงสุดที่รับได้ในขณะนี้ (kW)
          const maxPower = this.calculateMaxChargePower();

          // จำกัดกำลังชาร์จไม่ให้เกินค่าที่กำหนด
          let chargePower = Math.min(availablePower, maxPower);

          // ปรับกำลังชาร์จตามสถานะการชาร์จ (Charging Stage)
          if (this.stateOfCharge < 80) {
            this.chargingStage = "BULK"; // ชาร์จด้วยกระแสคงที่ (CC)
          } else if (this.stateOfCharge < 90) {
            this.chargingStage = "ABSORPTION"; // ลดกระแสลงเรื่อยๆ (CV)
            chargePower *= 0.7; // ลดกำลังชาร์จลง 30%
          } else {
            this.chargingStage = "FLOAT"; // รักษาระดับการชาร์จ
            chargePower *= 0.3; // ลดกำลังชาร์จลง 70%
          }

          // คำนวณพลังงานที่แบตเตอรี่ได้รับจริง (หลังหักประสิทธิภาพ)
          const energyIn = chargePower * this.chargeEfficiency;

          // สะสมพลังงานที่ชาร์จเข้า
          this.energyIn += energyIn;

          // คำนวณการเพิ่มขึ้นของ SoC (%)
          // จากสูตร: (พลังงานที่เข้า / ความจุทั้งหมด) * 100%
          const socIncrease = (energyIn / this.capacity) * 100;

          // อัพเดท SoC ไม่ให้เกิน maxSoC
          this.stateOfCharge = Math.min(
            this.maxSoC,
            this.stateOfCharge + socIncrease
          );

          // อัพเดทค่ากำลังไฟฟ้าปัจจุบัน (ลบคือชาร์จเข้า)
          this.currentPower = -chargePower;

          // บันทึกแหล่งพลังงานที่ใช้ชาร์จ
          this.lastChargeSource = isFromGrid ? "GRID" : "SOLAR";

          return chargePower; // ส่งกลับพลังงานที่ใช้ในการชาร์จ (kW)
        }

        discharge(requiredPower) {
          // ถ้าแบตเตอรี่ต่ำกว่าขีดจำกัด จะไม่จ่ายไฟ
          if (this.stateOfCharge <= this.minSoC) return 0;

          // คำนวณพลังงานสูงสุดที่จ่ายได้ในขณะนี้ (kW)
          const maxPower = this.calculateMaxDischargePower();

          // จำกัดกำลังจ่ายไม่ให้เกินค่าที่กำหนด
          let dischargePower = Math.min(requiredPower, maxPower);

          // คำนวณพลังงานที่ต้องใช้จากแบตเตอรี่ (หลังหักประสิทธิภาพ)
          const energyOut = dischargePower / this.dischargeEfficiency;

          // สะสมพลังงานที่จ่ายออก
          this.energyOut += energyOut;

          // คำนวณการลดลงของ SoC (%)
          const socDecrease = (energyOut / this.capacity) * 100;

          // ตรวจสอบว่า SoC จะลดลงต่ำกว่า minSoC หรือไม่
          if (this.stateOfCharge - socDecrease < this.minSoC) {
            // คำนวณพลังงานที่จ่ายได้จริงก่อนถึง minSoC
            const availableEnergyPct = this.stateOfCharge - this.minSoC;
            dischargePower =
              (availableEnergyPct / 100) *
              this.capacity *
              this.dischargeEfficiency;
            this.stateOfCharge = this.minSoC;
          } else {
            // ลด SoC ตามปกติ
            this.stateOfCharge -= socDecrease;
          }

          // อัพเดทค่ากำลังไฟฟ้าปัจจุบัน (บวกคือจ่ายออก)
          this.currentPower = dischargePower;
          this.chargingStage = "DISCHARGE";

          return dischargePower; // ส่งกลับพลังงานที่จ่ายได้จริง (kW)
        }

        updateTemperature(ambientTemp, batteryPower) {
          // อัตราส่วนกำลังปัจจุบันเทียบกับกำลังสูงสุด
          const powerFactor = Math.abs(batteryPower) / this.maxChargePower;

          // อุณหภูมิแบตเตอรี่จะเพิ่มขึ้นตามกำลังที่ใช้
          this.temperature = ambientTemp + powerFactor * 10;
        }

        calculateHealth() {
          // ลดอายุแบตเตอรี่ตามจำนวนรอบและอุณหภูมิ
          const cycleEffect = Math.max(0, 100 - this.cycleCount / 20);
          const tempEffect = Math.max(
            0,
            100 - Math.max(0, this.temperature - 35) * 2
          );
          this.healthStatus = Math.min(cycleEffect, tempEffect);
        }

        getStatus() {
          return {
            stateOfCharge: this.stateOfCharge,
            currentPower: this.currentPower,
            chargingStage: this.chargingStage,
            temperature: this.temperature,
            health: this.healthStatus,
            availableCapacity: this.capacity * (this.stateOfCharge / 100),
            maxChargePower: this.calculateMaxChargePower(),
            maxDischargePower: this.calculateMaxDischargePower(),
            capacity: this.capacity,
            cycleCount: this.cycleCount,
            lastChargeSource: this.lastChargeSource,
            efficiency: this.getEfficiency(),
          };
        }
      }

      class GridManager {
        constructor() {
          this.importedEnergy = 0; // พลังงานสะสมที่นำเข้า (kWh)
          this.exportedEnergy = 0; // พลังงานสะสมที่ส่งออก (kWh)
          this.peakDemand = 0; // ความต้องการไฟฟ้าสูงสุด (kW)
          this.allowFeedIn = true; // อนุญาตส่งออกพลังงานสู่กริด
          this.voltage = 230; // แรงดันไฟฟ้า (V)
          this.frequency = 50; // ความถี่ไฟฟ้า (Hz)
          this.powerFactor = 0.95; // ตัวประกอบกำลัง
          this.isConnected = true; // สถานะการเชื่อมต่อกับกริด

          // ตัวแปรสำหรับเก็บค่า Grid Import/Export ของชั่วโมงปัจจุบัน
          this.currentGridImport = 0; // กำลังไฟฟ้านำเข้าปัจจุบัน (kW)
          this.currentGridExport = 0; // กำลังไฟฟ้าส่งออกปัจจุบัน (kW)

          // เพิ่มค่าสำหรับการวิเคราะห์
          this.voltageHistory = []; // ประวัติแรงดันไฟฟ้า
          this.frequencyHistory = []; // ประวัติความถี่ไฟฟ้า
          this.instability = 0; // ค่าความไม่เสถียรของกริด (0-100%)
          this.totalCost = 0; // ค่าไฟฟ้าสะสม
          this.totalRevenue = 0; // รายได้จากการขายไฟสะสม
        }

        // ตรวจสอบคุณภาพไฟฟ้ากริด
        checkGridQuality() {
          // คำนวณเปอร์เซ็นต์การเบี่ยงเบนของแรงดันและความถี่
          const voltageDeviation = Math.abs((this.voltage - 230) / 230) * 100;
          const frequencyDeviation = Math.abs((this.frequency - 50) / 50) * 100;

          // ค่าความเสถียรของกริด
          const voltageStability = 100 - Math.min(100, voltageDeviation * 5);
          const frequencyStability =
            100 - Math.min(100, frequencyDeviation * 10);

          // คำนวณค่าคุณภาพกริดโดยรวม
          const overallQuality =
            voltageStability * 0.6 + frequencyStability * 0.4;
          const overallStatus = overallQuality > 80;

          return {
            voltageDeviation,
            frequencyDeviation,
            voltageStability,
            frequencyStability,
            overallQuality,
            overallStatus,
            powerFactor: this.powerFactor,
          };
        }

        managePowerFlow({
          solarPower,
          loadPower,
          batteryPower,
          gridImport,
          gridExport,
        }) {
          // ตรวจสอบว่าเชื่อมต่อกับกริดหรือไม่
          const isConnected = document.getElementById("gridConnected").checked;
          const allowExport =
            document.getElementById("allowExport")?.checked || true;

          if (!isConnected) {
            // กรณี off-grid จะไม่มีการนำเข้าหรือส่งออก
            gridImport = 0;
            gridExport = 0;
          } else if (!allowExport) {
            // กรณีเชื่อมต่อกริดแต่ไม่อนุญาตให้ส่งออก
            gridExport = 0;
          }

          // บันทึกค่ากำลังไฟฟ้าปัจจุบัน
          this.currentGridImport = gridImport;
          this.currentGridExport = this.allowFeedIn ? gridExport : 0;

          // สะสมพลังงาน (kWh) โดยสมมติว่าเป็น 1 ชั่วโมงเต็ม
          this.importedEnergy += this.currentGridImport;
          this.exportedEnergy += this.currentGridExport;

          // บันทึกค่าความต้องการไฟฟ้าสูงสุด
          if (this.currentGridImport > this.peakDemand) {
            this.peakDemand = this.currentGridImport;
          }

          // จำลองสภาวะกริด
          this.simulateGridConditions(solarPower, gridExport);

          // บันทึกประวัติ
          this.voltageHistory.push(this.voltage);
          this.frequencyHistory.push(this.frequency);

          // คำนวณความไม่เสถียรของกริด
          if (this.voltageHistory.length > 1) {
            const lastVoltage =
              this.voltageHistory[this.voltageHistory.length - 2];
            const lastFrequency =
              this.frequencyHistory[this.frequencyHistory.length - 2];

            // การเปลี่ยนแปลงอย่างรวดเร็วจะเพิ่มความไม่เสถียร
            const voltageChange = Math.abs(this.voltage - lastVoltage);
            const frequencyChange = Math.abs(this.frequency - lastFrequency);

            // คำนวณค่าความไม่เสถียรใหม่
            this.instability = Math.min(
              100,
              this.instability * 0.9 + voltageChange + frequencyChange * 10
            );
          }

          // คำนวณค่าไฟฟ้าและรายได้จากการขายไฟ
          const hour = new Date().getHours();
          const currentRate =
            ELECTRICITY_RATES.find((rate) => rate.hour === hour)?.price || 3.0;
          const sellRate = currentRate * 0.8; // สมมติว่าขายไฟได้ 80% ของราคาซื้อ

          this.totalCost += this.currentGridImport * currentRate;
          this.totalRevenue += this.currentGridExport * sellRate;
        }

        simulateGridConditions(solarPower, gridExport) {
          // ตรวจสอบว่าเชื่อมต่อกับกริดหรือไม่
          this.isConnected = document.getElementById("gridConnected").checked;

          if (!this.isConnected) {
            // ในโหมด off-grid จะไม่มีการปรับค่าจากกริด
            return;
          }

          // ค่าปกติของกริด
          const baseVoltage = 230;
          const baseFrequency = 50;

          // ความแปรปรวนทั่วไปของกริด (±1.5%)
          const normalVariation = 0.015;

          // ผลกระทบจากการจ่ายพลังงานเข้ากริด (เพิ่มแรงดัน ลดความถี่)
          const feedInEffect = (gridExport / 10) * 0.02; // 2% ต่อ 10kW

          // ผลกระทบจากการใช้พลังงานแสงอาทิตย์มาก (ความถี่ไม่เสถียร)
          const solarEffect = solarPower > 5 ? (solarPower / 20) * 0.01 : 0; // 1% ต่อ 20kW

          // คำนวณแรงดันและความถี่ใหม่
          this.voltage =
            baseVoltage *
            (1 + (Math.random() * 2 - 1) * normalVariation + feedInEffect);
          this.frequency =
            baseFrequency *
            (1 +
              (Math.random() * 2 - 1) * normalVariation -
              feedInEffect / 2 -
              solarEffect);

          // ปรับตัวประกอบกำลังตามการจ่ายพลังงานกลับเข้ากริด
          if (gridExport > 0) {
            this.powerFactor = Math.max(0.9, 0.98 - gridExport / 50);
          } else {
            this.powerFactor = 0.95 + (Math.random() * 2 - 1) * 0.02;
          }
        }

        getStatus() {
          return {
            voltage: this.voltage,
            frequency: this.frequency,
            powerFactor: this.powerFactor,
            isConnected: document.getElementById("gridConnected").checked,
            importedEnergy: this.importedEnergy,
            exportedEnergy: this.exportedEnergy,
            peakDemand: this.peakDemand,
            currentGridImport: this.currentGridImport,
            currentGridExport: this.currentGridExport,
            gridQuality: this.checkGridQuality(),
            instability: this.instability,
            totalCost: this.totalCost,
            totalRevenue: this.totalRevenue,
            netCost: this.totalCost - this.totalRevenue,
          };
        }
      }

      function updateCharts(
        solarProduction,
        batteryStatus,
        loadData,
        gridStatus,
        solarIrradiance
      ) {
        // ทำลายกราฟเก่า
        if (powerChart) {
          powerChart.destroy();
          powerChart = null;
        }
        if (batteryChart) {
          batteryChart.destroy();
          batteryChart = null;
        }
        if (batterySoCChart) {
          batterySoCChart.destroy();
          batterySoCChart = null;
        }
        if (batteryRateChart) {
          batteryRateChart.destroy();
          batteryRateChart = null;
        }

        // สร้างกราฟใหม่
        createPowerFlowChart(
          solarProduction,
          loadData.map((d) => d.load),
          gridStatus,
          solarIrradiance
        );

        if (batteryStatus && batteryStatus[0]) {
          createBatteryCharts(batteryStatus);
        }

        updateSystemSummary(
          solarProduction,
          batteryStatus,
          loadData,
          gridStatus
        );
      }

      function updateBatteryCharts(batteryStatus) {
        // Destroy existing charts if they exist
        if (batterySoCChart) {
          batterySoCChart.destroy();
        }
        if (batteryRateChart) {
          batteryRateChart.destroy();
        }

        // Create new SoC chart
        const ctxSoC = document
          .getElementById("batterySoCChart")
          .getContext("2d");
        batterySoCChart = new Chart(ctxSoC, {
          type: "line",
          data: {
            labels: Array.from({ length: 24 }, (_, i) => i),
            datasets: [
              {
                label: "State of Charge (%)",
                data: batteryStatus.map((s) => s.stateOfCharge),
                borderColor: "#4CAF50",
                backgroundColor: "rgba(76, 175, 80, 0.1)",
                fill: true,
              },
            ],
          },
          options: {
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                title: { display: true, text: "State of Charge (%)" },
              },
            },
          },
        });

        // Create new Rate chart
        const ctxRate = document
          .getElementById("batteryRateChart")
          .getContext("2d");
        batteryRateChart = new Chart(ctxRate, {
          type: "bar",
          data: {
            labels: Array.from({ length: 24 }, (_, i) => i),
            datasets: [
              {
                label: "Charging Rate (C)",
                data: batteryStatus.map((s) =>
                  s.currentPower > 0 ? s.currentPower / s.capacity : 0
                ),
                backgroundColor: "rgba(76, 175, 80, 0.5)",
              },
              {
                label: "Discharging Rate (C)",
                data: batteryStatus.map((s) =>
                  s.currentPower < 0 ? Math.abs(s.currentPower) / s.capacity : 0
                ),
                backgroundColor: "rgba(255, 87, 34, 0.5)",
              },
            ],
          },
          options: {
            scales: {
              y: {
                title: { display: true, text: "C-rate" },
                max: 1,
              },
            },
          },
        });
      }

      function updateSystemSummary(
        solarProduction,
        batteryStatus,
        loadData,
        gridStatus
      ) {
        try {
          // คำนวณผลรวมพลังงาน (kWh)
          const totalSolarProduction = solarProduction.reduce(
            (a, b) => a + b,
            0
          );
          const totalLoad = Array.isArray(loadData)
            ? loadData.reduce((a, b) => a + (b.load || 0), 0)
            : 0;
          const totalGridImport = gridStatus.reduce(
            (a, s) => a + (s.currentGridImport || 0),
            0
          );
          const totalGridExport = gridStatus.reduce(
            (a, s) => a + (s.currentGridExport || 0),
            0
          );

          // อัพเดทค่าในพื้นที่แสดงผล
          const elements = {
            totalEnergy: totalSolarProduction.toFixed(2) + " kWh",
            batteryStatus:
              batteryStatus && batteryStatus[0]
                ? batteryStatus[batteryStatus.length - 1].stateOfCharge.toFixed(
                    1
                  ) + "%"
                : "-- %",
            gridImportStatus: totalGridImport.toFixed(2) + " kWh",
            gridExportStatus: totalGridExport.toFixed(2) + " kWh",
          };

          Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
          });

          // คำนวณค่าสูงสุด
          const peakProduction = Math.max(...solarProduction);
          const peakLoad = Array.isArray(loadData)
            ? Math.max(...loadData.map((d) => d.load || 0))
            : 0;

          // ค่าเฉลี่ยการผลิต (แสดงเฉพาะช่วงกลางวัน 6:00-18:00)
          const daytimeProduction = solarProduction.slice(6, 19);
          const avgDaytimeProduction =
            daytimeProduction.reduce((a, b) => a + b, 0) /
            daytimeProduction.length;

          // คำนวณอัตราการใช้พลังงานตัวเอง (self-consumption rate)
          const selfConsumption =
            totalSolarProduction > 0
              ? ((totalSolarProduction - totalGridExport) /
                  totalSolarProduction) *
                100
              : 0;

          // คำนวณอัตราความเป็นอิสระจากกริด (grid independence)
          const gridIndependence =
            totalLoad > 0
              ? ((totalLoad - totalGridImport) / totalLoad) * 100
              : 0;

          // คำนวณการใช้งานแบตเตอรี่
          const hasBattery =
            batteryStatus && batteryStatus.length > 0 && batteryStatus[0];

          let batteryUtilization = 0;
          let batteryContribution = 0;
          let batteryCycles = 0;

          if (hasBattery) {
            // คำนวณการใช้งานแบตเตอรี่ (เฉลี่ยกำลังไฟที่เข้า/ออกแบต)
            batteryUtilization =
              batteryStatus.reduce(
                (a, s) => a + Math.abs(s.currentPower || 0),
                0
              ) / batteryStatus.length;

            // คำนวณสัดส่วนพลังงานที่แบตเตอรี่จัดการ (บวกคือจ่ายออก ลบคือชาร์จเข้า)
            const totalBatteryDischarge = batteryStatus.reduce(
              (a, s) => a + (s.currentPower > 0 ? s.currentPower : 0),
              0
            );

            batteryContribution = (totalBatteryDischarge / totalLoad) * 100;

            // ใช้ค่า cycleCount จากแบตเตอรี่
            batteryCycles =
              batteryStatus[batteryStatus.length - 1].cycleCount || 0;
          }

          // const financialResults = null;

          const financialResults = {
            financialMetrics: {
              dailyElectricityCost: totalGridImport * 4.0, // สมมติค่าไฟฟ้า 4 บาทต่อหน่วย
              dailyExportRevenue: totalGridExport * 2.5, // สมมติค่าขายไฟ 2.5 บาทต่อหน่วย
              dailySavings: totalGridImport * 4.0 - totalGridExport * 2.5,
              paybackPeriod: 7.5, // ค่าเฉลี่ยทั่วไป
            },
          };

          // อัพเดทตารางสรุประบบ
          const systemSummaryElement = document.getElementById("systemSummary");
          if (systemSummaryElement) {
            systemSummaryElement.innerHTML = `
        <div class="table-responsive">
            <table class="table table-sm">
                <tbody>
                    <tr>
                        <th>Total Solar Production:</th>
                        <td>${totalSolarProduction.toFixed(2)} kWh</td>
                        <th>Peak Production:</th>
                        <td>${peakProduction.toFixed(2)} kW</td>
                    </tr>
                    <tr>
                        <th>Avg Daytime Production:</th>
                        <td>${avgDaytimeProduction.toFixed(2)} kW</td>
                        <th>Total Load:</th>
                        <td>${totalLoad.toFixed(2)} kWh</td>
                    </tr>
                    <tr>
                        <th>Grid Import:</th>
                        <td>${totalGridImport.toFixed(2)} kWh</td>
                        <th>Grid Export:</th>
                        <td>${totalGridExport.toFixed(2)} kWh</td>
                    </tr>
                    <tr>
                        <th>Self-Consumption Rate:</th>
                        <td>${selfConsumption.toFixed(1)}%</td>
                        <th>Grid Independence:</th>
                        <td>${gridIndependence.toFixed(1)}%</td>
                    </tr>
                    ${
                      hasBattery
                        ? `
                    <tr>
                        <th>Battery Contribution:</th>
                        <td>${batteryContribution.toFixed(1)}% of load</td>
                        <th>Battery Utilization:</th>
                        <td>${batteryUtilization.toFixed(2)} kW avg</td>
                    </tr>
                    <tr>
                        <th>Battery Status:</th>
                        <td colspan="3">
                            SoC: ${batteryStatus[
                              batteryStatus.length - 1
                            ].stateOfCharge.toFixed(1)}%,
                            Health: ${batteryStatus[
                              batteryStatus.length - 1
                            ].health.toFixed(1)}%,
                            Est. Cycles Today: ${batteryCycles.toFixed(1)},
                            Stage: ${
                              batteryStatus[batteryStatus.length - 1]
                                .chargingStage
                            }
                        </td>
                    </tr>
                    `
                        : ""
                    }
                </tbody>
            </table>
        </div>
    `;
          }

          // อัพเดทสถานะกริด
          const gridStatusElement = document.getElementById("gridStatus");
          if (gridStatusElement && gridStatus.length > 0) {
            const latestGridStatus = gridStatus[gridStatus.length - 1];
            const gridQuality = latestGridStatus.gridQuality;

            // กำหนดสีตามคุณภาพกริด
            let alertClass = "alert-success";
            if (gridQuality.overallQuality < 70) {
              alertClass = "alert-danger";
            } else if (gridQuality.overallQuality < 85) {
              alertClass = "alert-warning";
            }

            gridStatusElement.innerHTML = `
        <div class="alert ${alertClass}">
            <h6>Grid Status:</h6>
            <div class="row">
                <div class="col-md-6">
                    <div>Voltage: ${latestGridStatus.voltage.toFixed(1)} V</div>
                    <div>Frequency: ${latestGridStatus.frequency.toFixed(
                      2
                    )} Hz</div>
                </div>
                <div class="col-md-6">
                    <div>Power Factor: ${latestGridStatus.powerFactor.toFixed(
                      3
                    )}</div>
                    <div>Grid Quality: ${gridQuality.overallQuality.toFixed(
                      1
                    )}%</div>
                </div>
            </div>
            <div class="progress mt-2" style="height: 5px;">
                <div class="progress-bar ${alertClass.replace(
                  "alert-",
                  "bg-"
                )}" role="progressbar" 
                     style="width: ${gridQuality.overallQuality}%"></div>
            </div>
        </div>
    `;
          }

          // อัพเดทข้อมูลค่าไฟฟ้า
          updateElectricityRateInfo();
        } catch (error) {
          console.error("Error in updateSystemSummary:", error);
          alert("Error updating system summary: " + error.message);
        }
      }

      async function simulateSystem(
        date,
        solarData,
        loadProfile,
        battery,
        grid
      ) {
        // ตรวจสอบข้อมูลนำเข้า
        if (!solarData?.totalCapacity || !loadProfile?.data) {
          throw new Error("Invalid input data");
        }

        // ตรวจสอบความถูกต้องของข้อมูลโหลด
        if (
          !loadProfile ||
          !loadProfile.data ||
          loadProfile.data.length !== 24
        ) {
          throw new Error("Invalid load profile data");
        }

        // ตรวจสอบความถูกต้องของข้อมูลระบบโซล่าร์
        if (!solarData || !solarData.totalCapacity) {
          throw new Error("Invalid solar installation data");
        }

        // เตรียมผลลัพธ์
        const results = {
          solarProduction: [], // กำลังผลิต (kW) แต่ละชั่วโมง
          batteryStatus: [], // สถานะแบตเตอรี่แต่ละชั่วโมง
          gridStatus: [], // สถานะกริดแต่ละชั่วโมง
          solarIrradiance: [], // ความเข้มแสง (W/m²) แต่ละชั่วโมง
          batteryFlows: [], // การไหลของพลังงานเข้า/ออกแบตเตอรี่
          gridFlows: [], // การไหลของพลังงานเข้า/ออกกริด
          energyFlows: [], // รายละเอียดการไหลของพลังงานทั้งระบบ
        };

        // ขอข้อมูลความเข้มแสงเฉลี่ยรายวัน (Wh/m²/day)
        const dailyIrradiance = await getNASAData(
          solarData.latitude,
          solarData.longitude,
          date
        );

        // คำนวณความเข้มแสงรายชั่วโมง (W/m²)
        const hourlyIrradiance = calculateHourlyIrradiance(dailyIrradiance);

        // ตรวจสอบการตั้งค่าการปรับแต่งตามเวลา
        const optimizeForTOU =
          document.getElementById("optimizeForTOU")?.checked || false;
        const peakRateThreshold = parseFloat(
          document.getElementById("peakRateThreshold")?.value || PEAK_THRESHOLD
        );

        // ตรวจสอบการตั้งค่ากริด
        const isGridConnected =
          document.getElementById("gridConnected").checked;
        const allowExport =
          document.getElementById("allowExport")?.checked || true; // ค่าเริ่มต้นคือ allow export

        // จำลองการทำงานของระบบทุกชั่วโมงใน 1 วัน
        for (let hour = 0; hour < 24; hour++) {
          // หาค่าไฟปัจจุบัน
          const currentRate =
            ELECTRICITY_RATES.find((rate) => rate.hour === hour)?.price || 3.0; // ค่าเริ่มต้นถ้าไม่พบ
          const isPeakHour = currentRate >= peakRateThreshold;

          // สมมติอุณหภูมิตามช่วงเวลา (25°C + เพิ่มในช่วงกลางวัน)
          const currentTemperature =
            25 +
            (hour >= 9 && hour <= 16 ? 10 : hour >= 6 && hour <= 18 ? 5 : 0);

          // ตรวจสอบว่าแบตเตอรี่เต็มหรือไม่
          const batteryIsFull = battery
            ? battery.stateOfCharge >= battery.maxSoC
            : false;

          // คำนวณโหลดในชั่วโมงนี้
          const load = loadProfile.data[hour].load;

          // คำนวณประเภทระบบ
          const systemType = isGridConnected
            ? allowExport
              ? "grid-tied"
              : "grid-tied-no-export"
            : battery
            ? "off-grid"
            : "off-grid-no-export";

          // คำนวณกำลังผลิตจากโซล่าเซลล์
          const solarPower = calculateSolarOutput(
            hourlyIrradiance[hour],
            solarData.totalCapacity,
            currentTemperature,
            systemType,
            load,
            batteryIsFull
          );

          console.log(
            `Hour ${hour}: Solar=${solarPower.toFixed(
              2
            )} kW, Load=${load.toFixed(
              2
            )} kW, Temp=${currentTemperature}°C, Rate=${currentRate}฿`
          );

          // --------- การจัดการพลังงาน ---------
          let remainingSolar = solarPower;
          let remainingLoad = load;

          // ค่าพลังงานที่จะบันทึก
          let loadSuppliedBySolar = 0;
          let loadSuppliedByBattery = 0;
          let loadSuppliedByGrid = 0;
          let solarToChargeBattery = 0;
          let solarToGrid = 0;
          let gridToBattery = 0;
          let batteryPower = 0;
          let gridImport = 0;
          let gridExport = 0;

          // 1. จ่ายให้โหลดก่อน
          if (remainingSolar >= remainingLoad) {
            loadSuppliedBySolar = remainingLoad;
            remainingSolar -= remainingLoad;
            remainingLoad = 0;
          } else {
            loadSuppliedBySolar = remainingSolar;
            remainingLoad -= remainingSolar;
            remainingSolar = 0;
          }

          // 2. ชาร์จแบตเตอรี่ด้วยพลังงานที่เหลือ (ถ้ามี)
          if (battery && remainingSolar > 0) {
            solarToChargeBattery = battery.charge(remainingSolar);
            remainingSolar -= solarToChargeBattery;
            batteryPower -= solarToChargeBattery; // ลบเพราะกำลังชาร์จ (บวกคือจ่าย)
          }

          // 3. ส่งออกสู่กริด (ถ้าอนุญาต)
          if (isGridConnected && allowExport && remainingSolar > 0) {
            solarToGrid = remainingSolar;
            gridExport += solarToGrid;
            remainingSolar = 0;
          }

          // 4. จ่ายโหลดที่เหลือจากแบตเตอรี่ (ถ้ามี)
          if (battery && remainingLoad > 0) {
            // กรณีพิเศษ: ถ้าเป็นช่วง peak และเปิดใช้ optimizeForTOU ให้พยายามจ่ายจากแบตเตอรี่มากขึ้น
            const shouldUseMoreBattery =
              optimizeForTOU && isPeakHour && battery.stateOfCharge > 30;

            let targetDischarge = remainingLoad;
            if (shouldUseMoreBattery) {
              // พยายามจ่ายจากแบตมากขึ้นในช่วง peak เพื่อลดการใช้ไฟกริด
              targetDischarge = Math.min(
                remainingLoad * 1.2, // พยายามจ่ายมากกว่าที่จำเป็น 20%
                battery.calculateMaxDischargePower() // แต่ไม่เกินกำลังสูงสุดที่จ่ายได้
              );
            }

            loadSuppliedByBattery = battery.discharge(targetDischarge);
            batteryPower += loadSuppliedByBattery; // บวกเพราะกำลังจ่าย
            remainingLoad -= loadSuppliedByBattery;
          }

          // 5. จ่ายโหลดจากกริด (ถ้าเชื่อมต่อ)
          if (isGridConnected && remainingLoad > 0) {
            loadSuppliedByGrid = remainingLoad;
            gridImport += loadSuppliedByGrid;
            remainingLoad = 0;
          } else if (remainingLoad > 0) {
            // กรณี off-grid และพลังงานไม่พอ จะเกิดไฟดับ
            console.log(
              `Hour ${hour}: BLACKOUT - Insufficient power in off-grid mode`
            );
          }

          // 6. ชาร์จแบตเตอรี่จากกริดในช่วงไฟถูก (ถ้าอนุญาต)
          if (
            battery &&
            isGridConnected &&
            document.getElementById("allowGridCharge").checked &&
            optimizeForTOU
          ) {
            if (!isPeakHour && battery.stateOfCharge < 80) {
              // ช่วงค่าไฟถูก ชาร์จจากกริดได้
              const chargeFromGrid = battery.charge(
                battery.maxChargePower * 0.7,
                true
              );
              gridToBattery = chargeFromGrid;
              gridImport += chargeFromGrid;
              batteryPower -= chargeFromGrid; // ลบเพราะกำลังชาร์จ
            }
          }

          // อัพเดทสถานะกริด
          grid.managePowerFlow({
            solarPower,
            loadPower: load,
            batteryPower,
            gridImport,
            gridExport,
          });

          // อัพเดทสถานะแบตเตอรี่
          if (battery) {
            // จำลองอุณหภูมิแวดล้อมตามช่วงเวลาของวัน
            const ambientTemp = 25 + (hour > 6 && hour < 18 ? 5 : 0);
            battery.updateTemperature(ambientTemp, batteryPower);
            battery.calculateHealth();

            // เพิ่มรอบการชาร์จเมื่อมีการเปลี่ยนจากจ่ายเป็นชาร์จหรือกลับกัน
            if (
              hour > 0 &&
              ((batteryPower < 0 &&
                results.batteryStatus[hour - 1].currentPower > 0) ||
                (batteryPower > 0 &&
                  results.batteryStatus[hour - 1].currentPower < 0))
            ) {
              battery.cycleCount += 0.5; // นับเป็นครึ่งรอบเมื่อเปลี่ยนโหมด
            }
          }

          // บันทึกผลลัพธ์
          results.solarProduction.push(solarPower);
          results.batteryStatus.push(battery ? battery.getStatus() : null);
          results.gridStatus.push(grid.getStatus());
          results.solarIrradiance.push(hourlyIrradiance[hour]);

          // บันทึกรายละเอียดการไหลของพลังงาน
          results.energyFlows.push({
            hour,
            solarPower,
            load,
            loadSuppliedBySolar,
            loadSuppliedByBattery,
            loadSuppliedByGrid,
            solarToChargeBattery,
            solarToGrid,
            gridToBattery,
            batteryPower,
            gridImport,
            gridExport,
            electricityRate: currentRate,
            isPeakHour,
          });

          // บันทึกรายละเอียดการไหลของแบตเตอรี่
          results.batteryFlows.push({
            hour,
            stateOfCharge: battery ? battery.stateOfCharge : 0,
            charging: solarToChargeBattery + gridToBattery,
            discharging: loadSuppliedByBattery,
            netPower: batteryPower,
          });

          // บันทึกรายละเอียดการไหลของกริด
          results.gridFlows.push({
            hour,
            import: gridImport,
            export: gridExport,
            netPower: gridImport - gridExport,
            cost: gridImport * currentRate - gridExport * (currentRate * 0.8), // สมมติว่าขายได้ 80% ของราคา
          });
        }

        return results;
      }
      function createPowerFlowChart(
        solarProduction,
        loadData,
        gridStatus,
        solarIrradiance
      ) {
        const ctx = document.getElementById("powerChart").getContext("2d");
        const hours = Array.from({ length: 24 }, (_, i) => i);

        // สร้างชุดข้อมูลสำหรับความสมดุลพลังงาน
        const netPower = hours.map((hour) => {
          return solarProduction[hour] - loadData[hour];
        });

        // สร้างชุดข้อมูลสำหรับการแสดงผล
        powerChart = new Chart(ctx, {
          type: "line",
          data: {
            labels: hours.map((h) => `${h}:00`),
            datasets: [
              {
                label: "Solar Production (kW)",
                data: solarProduction,
                borderColor: "#FDB813",
                backgroundColor: "rgba(253, 184, 19, 0.1)",
                fill: true,
                yAxisID: "y-power",
              },
              {
                label: "Load (kW)",
                data: loadData,
                borderColor: "#FF6B6B",
                backgroundColor: "rgba(255, 107, 107, 0.1)",
                fill: true,
                yAxisID: "y-power",
              },
              {
                label: "Net Power (kW)",
                data: netPower,
                borderColor: "#4CAF50",
                borderWidth: 2,
                pointRadius: 3,
                fill: false,
                yAxisID: "y-power",
              },
              {
                label: "Grid Import (kW)",
                data: gridStatus.map((s) => s.currentGridImport || 0),
                borderColor: "#2196F3",
                backgroundColor: "rgba(33, 150, 243, 0.1)",
                fill: true,
                yAxisID: "y-power",
              },
              {
                label: "Grid Export (kW)",
                data: gridStatus.map((s) => s.currentGridExport || 0),
                borderColor: "#9C27B0",
                backgroundColor: "rgba(156, 39, 176, 0.1)",
                fill: true,
                yAxisID: "y-power",
              },
              {
                label: "Solar Irradiance (W/m²)",
                data: solarIrradiance,
                borderColor: "#FFA726",
                borderDash: [5, 5],
                fill: false,
                yAxisID: "y-irradiance",
              },
            ],
          },
          options: {
            responsive: true,
            interaction: {
              mode: "index",
              intersect: false,
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: "Time (hours)",
                },
              },
              "y-power": {
                type: "linear",
                position: "left",
                title: {
                  display: true,
                  text: "Power (kW)",
                },
                beginAtZero: true,
              },
              "y-irradiance": {
                type: "linear",
                position: "right",
                title: {
                  display: true,
                  text: "Solar Irradiance (W/m²)",
                },
                beginAtZero: true,
                grid: {
                  drawOnChartArea: false,
                },
              },
            },
            plugins: {
              title: {
                display: true,
                text: "Power Flow Analysis (24 Hour)",
              },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    const label = context.dataset.label || "";
                    const value = context.parsed.y;
                    return `${label}: ${value.toFixed(2)}`;
                  },
                },
              },
            },
          },
        });
      }

      //
      //
      //

      function createBatteryCharts(batteryStatus) {
        // สร้างกราฟสถานะแบตเตอรี่
        const ctxBattery = document
          .getElementById("batteryChart")
          .getContext("2d");
        const hours = Array.from({ length: 24 }, (_, i) => i);

        // สร้างชุดข้อมูลสำหรับ power flow ของแบตเตอรี่ (+ คือจ่าย, - คือชาร์จ)
        const batteryPower = batteryStatus.map((s) => s.currentPower);

        batteryChart = new Chart(ctxBattery, {
          type: "line",
          data: {
            labels: hours.map((h) => `${h}:00`),
            datasets: [
              {
                label: "State of Charge (%)",
                data: batteryStatus.map((s) => s.stateOfCharge),
                borderColor: "#4CAF50",
                backgroundColor: "rgba(76, 175, 80, 0.1)",
                fill: true,
                yAxisID: "y-soc",
              },
              {
                label: "Available Capacity (kWh)",
                data: batteryStatus.map((s) => s.availableCapacity),
                borderColor: "#2196F3",
                backgroundColor: "rgba(33, 150, 243, 0.1)",
                fill: false,
                yAxisID: "y-capacity",
              },
              {
                label: "Battery Power (kW)",
                data: batteryPower,
                borderColor: "#FF9800",
                borderWidth: 2,
                pointRadius: 3,
                fill: false,
                yAxisID: "y-power",
              },
            ],
          },
          options: {
            responsive: true,
            scales: {
              x: {
                title: {
                  display: true,
                  text: "Time (hours)",
                },
              },
              "y-soc": {
                type: "linear",
                position: "left",
                title: {
                  display: true,
                  text: "State of Charge (%)",
                },
                min: 0,
                max: 100,
              },
              "y-capacity": {
                type: "linear",
                position: "right",
                title: {
                  display: true,
                  text: "Available Capacity (kWh)",
                },
                beginAtZero: true,
                grid: {
                  drawOnChartArea: false,
                },
              },
              "y-power": {
                type: "linear",
                position: "right",
                title: {
                  display: true,
                  text: "Battery Power (kW)",
                },
                grid: {
                  drawOnChartArea: false,
                },
              },
            },
            plugins: {
              title: {
                display: true,
                text: "Battery Status (24 Hour)",
              },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    const label = context.dataset.label || "";
                    const value = context.parsed.y;
                    if (label === "Battery Power (kW)") {
                      const status =
                        value > 0
                          ? "Discharging"
                          : value < 0
                          ? "Charging"
                          : "Idle";
                      return `${label}: ${value.toFixed(2)} (${status})`;
                    }
                    return `${label}: ${value.toFixed(2)}`;
                  },
                },
              },
            },
          },
        });

        // สร้างกราฟสถานะประจุแบตเตอรี่ (SoC)
        const ctxSoC = document
          .getElementById("batterySoCChart")
          .getContext("2d");

        // ดึงค่า min SoC จาก UI
        const minSoC =
          parseFloat(document.getElementById("minBatteryLevel").value) || 20;

        batterySoCChart = new Chart(ctxSoC, {
          type: "line",
          data: {
            labels: hours.map((h) => `${h}:00`),
            datasets: [
              {
                label: "State of Charge (%)",
                data: batteryStatus.map((s) => s.stateOfCharge),
                borderColor: "#4CAF50",
                backgroundColor: "rgba(76, 175, 80, 0.1)",
                fill: true,
              },
              {
                label: "Minimum SoC",
                data: hours.map(() => minSoC),
                borderColor: "#F44336",
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
              },
            ],
          },
          options: {
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                title: {
                  display: true,
                  text: "State of Charge (%)",
                },
              },
              x: {
                title: {
                  display: true,
                  text: "Time (hours)",
                },
              },
            },
            plugins: {
              title: {
                display: true,
                text: "Battery State of Charge",
              },
            },
          },
        });

        // สร้างกราฟอัตราการชาร์จ/จ่ายของแบตเตอรี่
        const ctxRate = document
          .getElementById("batteryRateChart")
          .getContext("2d");

        // แยกข้อมูลการชาร์จและจ่าย
        const chargingRate = batteryStatus.map((s) =>
          s.currentPower < 0 ? Math.abs(s.currentPower) / s.capacity : 0
        );

        const dischargingRate = batteryStatus.map((s) =>
          s.currentPower > 0 ? s.currentPower / s.capacity : 0
        );

        batteryRateChart = new Chart(ctxRate, {
          type: "bar",
          data: {
            labels: hours.map((h) => `${h}:00`),
            datasets: [
              {
                label: "Charging Rate (C)",
                data: chargingRate,
                backgroundColor: "rgba(76, 175, 80, 0.5)",
              },
              {
                label: "Discharging Rate (C)",
                data: dischargingRate,
                backgroundColor: "rgba(255, 87, 34, 0.5)",
              },
            ],
          },
          options: {
            scales: {
              y: {
                title: {
                  display: true,
                  text: "C-rate",
                },
                beginAtZero: true,
                suggestedMax: 1,
              },
              x: {
                title: {
                  display: true,
                  text: "Time (hours)",
                },
              },
            },
            plugins: {
              title: {
                display: true,
                text: "Battery Charge/Discharge Rate",
              },
            },
          },
        });
      }

      function calculateSolarOutput(
        irradiance,
        installedCapacity,
        temperature = 25,
        systemType = "grid-tied",
        load = 0,
        batteryIsFull = false
      ) {
        // ประสิทธิภาพมาตรฐานที่ STC (1000 W/m², 25°C)
        const standardEfficiency = 1.0;

        // ค่าสัมประสิทธิ์อุณหภูมิ (ลดลง 0.4% ต่อ °C ที่เพิ่มขึ้นเมื่อเกิน 25°C)
        const temperatureCoefficient = -0.004;

        // ปัจจัยอุณหภูมิ
        const temperatureFactor =
          1 + temperatureCoefficient * (temperature - 25);

        // ปัจจัยความเข้มแสง
        let irradianceFactor;
        if (irradiance <= 0) {
          irradianceFactor = 0;
        } else if (irradiance < 200) {
          // ประสิทธิภาพต่ำกว่าเส้นตรงเมื่อแสงน้อยมาก
          irradianceFactor = (irradiance / 1000) * 0.9;
        } else {
          irradianceFactor = irradiance / 1000;
        }

        // กำลังการผลิตทางทฤษฎี (kW)
        const theoreticalPower =
          installedCapacity *
          irradianceFactor *
          temperatureFactor *
          standardEfficiency;

        // สำหรับระบบ off-grid ที่ไม่มีการขายไฟและแบตเตอรี่เต็ม จะใช้พลังงานเท่าที่โหลดต้องการเท่านั้น
        if (
          systemType === "off-grid-no-export" &&
          theoreticalPower > load &&
          batteryIsFull
        ) {
          return load;
        }

        return theoreticalPower;
      }

      document.addEventListener("DOMContentLoaded", function () {
        const dateInput = document.getElementById("date");
        const today = new Date().toISOString().split("T")[0];
        dateInput.value = today;
        dateInput.max = today;
      });

      // เพิ่มตอนต้นไฟล์
      window.addEventListener("error", function (event) {
        console.error("Global error handler:", event.error);

        // ถ้าเกิดข้อผิดพลาดขณะกำลังจำลอง ให้ล้าง progress indicator
        const progressElement = document.getElementById("simulation-progress");
        if (progressElement) {
          progressElement.remove();
        }

        // แสดงข้อความแจ้งเตือนข้อผิดพลาด
        const errorMessage = event.error
          ? event.error.message || "Unknown error"
          : "Unknown error";
        alert(
          `An error occurred: ${errorMessage}\nPlease check console for details.`
        );

        return false;
      });

      // ล้างข้อมูลที่ไม่ถูกต้อง
      function resetSimulationState() {
        // ล้างตัวแปรสถานะ
        window.importedData = null;
        window.loadProfile = null;

        // ล้างกราฟ
        if (powerChart) {
          powerChart.destroy();
          powerChart = null;
        }
        if (batteryChart) {
          batteryChart.destroy();
          batteryChart = null;
        }
        if (batterySoCChart) {
          batterySoCChart.destroy();
          batterySoCChart = null;
        }
        if (batteryRateChart) {
          batteryRateChart.destroy();
          batteryRateChart = null;
        }

        // ล้างข้อมูลแสดงผล
        document.getElementById("totalEnergy").textContent = "-- kWh";
        document.getElementById("batteryStatus").textContent = "-- kWh";
        document.getElementById("gridImportStatus").textContent = "-- kWh";
        document.getElementById("gridExportStatus").textContent = "-- kWh";

        if (document.getElementById("systemSummary")) {
          document.getElementById("systemSummary").innerHTML = "";
        }

        if (document.getElementById("gridStatus")) {
          document.getElementById("gridStatus").innerHTML = "";
        }

        if (document.getElementById("areaDetails")) {
          document.getElementById("areaDetails").innerHTML = "";
        }

        alert(
          "Simulation state has been reset. Please import your data and try again."
        );
      }

      document.addEventListener("DOMContentLoaded", function () {
        // ตั้งค่าวันที่ปัจจุบัน
        const dateInput = document.getElementById("date");
        const today = new Date().toISOString().split("T")[0];
        dateInput.value = today;
        dateInput.max = today;

        // เพิ่มส่วนควบคุมการส่งออกกริด
        const gridConnectedLabel = document.querySelector(
          'label[for="gridConnected"]'
        );
        if (gridConnectedLabel) {
          gridConnectedLabel.textContent =
            "Connect to Grid (allows import/export)";

          // เพิ่มตัวเลือกการส่งออกกริด
          const gridExportDiv = document.createElement("div");
          gridExportDiv.className = "col-md-3";
          gridExportDiv.innerHTML = `
      <div class="form-check mt-4">
        <input type="checkbox" class="form-check-input" id="allowExport" checked />
        <label class="form-check-label" for="allowExport">Allow Export to Grid</label>
      </div>
    `;

          const parent = gridConnectedLabel.closest(".col-md-3").parentNode;
          parent.appendChild(gridExportDiv);
        }

        // เพิ่มส่วนควบคุมการปรับแต่งตามเวลา (Time-of-Use)
        const batterySection = document
          .querySelector("#hasBattery")
          .closest(".row");
        if (batterySection) {
          const touDiv = document.createElement("div");
          touDiv.className = "row g-3 mt-2";
          touDiv.innerHTML = `
      <div class="col-md-4">
        <label class="form-label">Peak Rate Threshold (฿/kWh)</label>
        <input type="number" class="form-control battery-input" id="peakRateThreshold" value="4.0" step="0.1" min="0" disabled />
      </div>
      <div class="col-md-4">
        <div class="form-check mt-4">
          <input type="checkbox" class="form-check-input battery-input" id="optimizeForTOU" disabled />
          <label class="form-check-label" for="optimizeForTOU">Optimize for Time-of-Use Rates</label>
        </div>
      </div>
    `;

          batterySection.after(touDiv);
        }

        // เพิ่มปุ่มโหลดข้อมูลตัวอย่าง
        const importSection = document.querySelector(".card-body");
        if (importSection) {
          const loadSampleButton = document.createElement("button");
          loadSampleButton.type = "button";
          loadSampleButton.className = "btn btn-outline-secondary ms-2";
          loadSampleButton.textContent = "Load Sample Data";
          loadSampleButton.onclick = createSampleData;

          const fileUploadLabel = document.querySelector(".upload-btn");
          if (fileUploadLabel && fileUploadLabel.parentNode) {
            fileUploadLabel.parentNode.appendChild(loadSampleButton);
          }
        }

        // เพิ่มปุ่มรีเซ็ตข้อมูล
        const formElement = document.getElementById("solarForm");
        if (formElement) {
          const resetButton = document.createElement("button");
          resetButton.type = "button";
          resetButton.className = "btn btn-outline-danger ms-2";
          resetButton.textContent = "Reset All Data";
          resetButton.onclick = function () {
            // ล้างข้อมูลทั้งหมด
            window.importedData = null;
            window.loadProfile = null;

            // ล้างกราฟ
            if (powerChart) {
              powerChart.destroy();
              powerChart = null;
            }
            if (batteryChart) {
              batteryChart.destroy();
              batteryChart = null;
            }
            if (batterySoCChart) {
              batterySoCChart.destroy();
              batterySoCChart = null;
            }
            if (batteryRateChart) {
              batteryRateChart.destroy();
              batteryRateChart = null;
            }

            // ล้างข้อมูลแสดงผล
            document.getElementById("totalEnergy").textContent = "-- kWh";
            document.getElementById("batteryStatus").textContent = "-- kWh";
            document.getElementById("gridImportStatus").textContent = "-- kWh";
            document.getElementById("gridExportStatus").textContent = "-- kWh";

            // ล้างสรุปข้อมูล
            document.getElementById("importSummary").innerHTML = "";
            document.getElementById("loadImportSummary").innerHTML = "";
            document.getElementById("fileName").textContent = "";
            document.getElementById("loadFileName").textContent = "";

            if (document.getElementById("systemSummary")) {
              document.getElementById("systemSummary").innerHTML = "";
            }

            if (document.getElementById("gridStatus")) {
              document.getElementById("gridStatus").innerHTML = "";
            }

            if (document.getElementById("areaDetails")) {
              document.getElementById("areaDetails").innerHTML = "";
            }

            alert("Simulation state has been reset.");
          };

          const runButton = formElement.querySelector(
            "button[onclick='startSimulation()']"
          );
          if (runButton && runButton.parentNode) {
            runButton.parentNode.appendChild(resetButton);
          }
        }

        // เพิ่มส่วนแสดงผลค่าไฟฟ้า
        const systemParamsSection = document.querySelector(
          ".card-body h5.card-title"
        );
        if (
          systemParamsSection &&
          systemParamsSection.textContent === "System Parameters"
        ) {
          const electricityRatesDiv = document.createElement("div");
          electricityRatesDiv.className = "card mb-4 mt-3";
          electricityRatesDiv.innerHTML = `
      <div class="card-body">
        <h5 class="card-title">Electricity Rates</h5>
        <div class="d-flex justify-content-between mb-2">
          <span>Off-Peak Hours (00:00-09:00, 22:00-24:00): 2.50 ฿/kWh</span>
          <span>Peak Hours (09:00-22:00): 4.50 ฿/kWh</span>
        </div>
        <div class="progress" style="height: 30px;">
          <div class="progress-bar bg-success" role="progressbar" style="width: 37.5%" aria-valuenow="37.5" aria-valuemin="0" aria-valuemax="100">Off-Peak (9h)</div>
          <div class="progress-bar bg-danger" role="progressbar" style="width: 54.2%" aria-valuenow="54.2" aria-valuemin="0" aria-valuemax="100">Peak (13h)</div>
          <div class="progress-bar bg-success" role="progressbar" style="width: 8.3%" aria-valuenow="8.3" aria-valuemin="0" aria-valuemax="100">Off-Peak (2h)</div>
        </div>
      </div>
    `;
          systemParamsSection.closest(".card").after(electricityRatesDiv);
        }

        // เพิ่ม event listener สำหรับการเปลี่ยนแปลงการตั้งค่าแบตเตอรี่
        const hasBatteryCheckbox = document.getElementById("hasBattery");
        if (hasBatteryCheckbox) {
          hasBatteryCheckbox.addEventListener("change", function () {
            const touInputs = document.querySelectorAll(
              "#peakRateThreshold, #optimizeForTOU"
            );
            touInputs.forEach((input) => {
              input.disabled = !this.checked;
            });
          });
        }

        // เพิ่ม event listener สำหรับการเปลี่ยนแปลงการเชื่อมต่อกริด
        const gridConnectedCheckbox = document.getElementById("gridConnected");
        if (gridConnectedCheckbox) {
          gridConnectedCheckbox.addEventListener("change", function () {
            const allowExportCheckbox = document.getElementById("allowExport");
            if (allowExportCheckbox) {
              allowExportCheckbox.disabled = !this.checked;
            }

            const allowGridChargeCheckbox =
              document.getElementById("allowGridCharge");
            if (allowGridChargeCheckbox) {
              allowGridChargeCheckbox.disabled =
                !this.checked || !document.getElementById("hasBattery").checked;
            }
          });
        }

        // เพิ่มฟังก์ชันนี้ก่อนที่จะมีการเรียกใช้ในฟังก์ชัน updateSystemSummary
        function calculateFinancialReturns(results) {
          // ตรวจสอบข้อมูลผลลัพธ์
          if (!results || !results.solarProduction || !results.gridStatus) {
            return null;
          }

          // ข้อมูลเริ่มต้น
          const solarCapacity =
            parseFloat(document.getElementById("ratedPower").value) || 0;
          const hasBattery = document.getElementById("hasBattery").checked;
          const batteryCapacity = hasBattery
            ? parseFloat(document.getElementById("batteryCapacity").value) || 0
            : 0;

          // ประมาณการต้นทุนระบบ
          const solarCost = solarCapacity * 40000; // 40,000 บาทต่อ kWp
          const batteryCost = batteryCapacity * 15000; // 15,000 บาทต่อ kWh
          const inverterCost = solarCapacity * 10000; // 10,000 บาทต่อ kWp
          const installationCost = solarCapacity * 5000; // 5,000 บาทต่อ kWp
          const totalSystemCost =
            solarCost + batteryCost + inverterCost + installationCost;

          // คำนวณค่าไฟฟ้าและรายได้
          const totalSolarProduction = results.solarProduction.reduce(
            (sum, p) => sum + p,
            0
          );
          const totalGridImport = results.gridStatus.reduce(
            (sum, s) => sum + (s.currentGridImport || 0),
            0
          );
          const totalGridExport = results.gridStatus.reduce(
            (sum, s) => sum + (s.currentGridExport || 0),
            0
          );

          // คำนวณค่าไฟฟ้าและรายได้ตามช่วงเวลา
          let electricityCost = 0;
          let exportRevenue = 0;

          // สมมติค่าไฟฟ้าเฉลี่ย
          const avgElectricityRate = 4.0; // บาทต่อหน่วย
          const avgExportRate = 2.5; // บาทต่อหน่วย

          electricityCost = totalGridImport * avgElectricityRate;
          exportRevenue = totalGridExport * avgExportRate;

          // คำนวณค่าไฟฟ้าถ้าไม่มีระบบโซล่าร์
          const totalLoad = results.energyFlows
            ? results.energyFlows.reduce((sum, flow) => sum + flow.load, 0)
            : totalSolarProduction + totalGridImport - totalGridExport;

          const baselineCost = totalLoad * avgElectricityRate;

          // ประมาณการผลประหยัดรายปี
          const dailySavings = baselineCost - electricityCost + exportRevenue;
          const annualSavings = dailySavings * 365;

          // คำนวณระยะเวลาคืนทุน
          const paybackPeriod =
            annualSavings > 0 ? totalSystemCost / annualSavings : 999;

          return {
            systemCost: {
              solar: solarCost,
              battery: batteryCost,
              inverter: inverterCost,
              installation: installationCost,
              total: totalSystemCost,
            },
            energyMetrics: {
              solarProduction: totalSolarProduction,
              gridImport: totalGridImport,
              gridExport: totalGridExport,
              selfConsumptionRate:
                ((totalSolarProduction - totalGridExport) /
                  totalSolarProduction) *
                100,
            },
            financialMetrics: {
              dailyElectricityCost: electricityCost,
              dailyExportRevenue: exportRevenue,
              dailySavings: dailySavings,
              annualSavings: annualSavings,
              paybackPeriod: paybackPeriod,
            },
          };
        }

        // เพิ่มการจัดการข้อผิดพลาดระดับสูงสุด
        window.addEventListener("error", function (event) {
          console.error("Global error handler:", event.error);

          // ถ้าเกิดข้อผิดพลาดขณะกำลังจำลอง ให้ล้าง progress indicator
          const progressElement = document.getElementById(
            "simulation-progress"
          );
          if (progressElement) {
            progressElement.remove();
          }

          // แสดงข้อความแจ้งเตือนข้อผิดพลาด
          const errorMessage = event.error
            ? event.error.message || "Unknown error"
            : "Unknown error";
          alert(
            `An error occurred: ${errorMessage}\nPlease check console for details.`
          );

          return false;
        });
      });
