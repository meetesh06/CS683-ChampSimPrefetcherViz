import './App.css';
import { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import { AppBar, Divider, IconButton, Link, TextField, Toolbar, Tooltip, Typography } from '@mui/material';

import LinearProgress from '@mui/material/LinearProgress';
import Slider from '@mui/material/Slider';

import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

import { JsonView, allExpanded, darkStyles, defaultStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});




const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

function App() {

  const [mainData, setMainData] = useState([]);
  const [eventID, setEventID] = useState(0);
  const [sliderLimits, setSliderLimits] = useState([0,0]);
  const [addressesPerRow, setAddressesPerRow] = useState(150);

  const [canvasData, setCanvasData] = useState([1090,800]);
  const [loading, setLoading] = useState(false);

  const [eventData, setEventData] = useState(
    {
      EVENT_NAME: "NIL",
      ADDR: 0,
      IP: 0,
      TYPE: "NIL",
      CACHE_HIT: "NIL",
      CACHE_NAME: "NIL",
      CYCLE: 0,
    }
  );

  const [ASMR, setASMR] = useState(false);
  const [ASMRTimer, setASMRTimer] = useState(0);
  const [timePerEvent, setTimePerEvent] = useState(100);

  useEffect(() => {
    handlePlot()
  }, [eventID, addressesPerRow, mainData])

  const handlePlot = () => {
    if (!mainData.ADDR) return;
      let c = document.getElementById("myCanvas");
      let ctx = c.getContext("2d");
      ctx.fillStyle = "#fafafa";
      ctx.fillRect(0, 0, canvasData[0], canvasData[1]);

    let eventNameSubset = mainData["EVENT_NAME"].filter( (a ,index) => index <= eventID )
    let cacheHitSubset = mainData["CACHE_HIT"].filter( (a ,index) => index <= eventID )
    let addrSubset = mainData["ADDR"].filter( (a ,index) => index <= eventID )
    
    let addrClasses = {}



    setEventData({
      EVENT_NAME: mainData["EVENT_NAME"][eventID],
      ADDR: mainData["ADDR"][eventID],
      IP: mainData["IP"][eventID],
      TYPE: mainData["TYPE"][eventID],
      CACHE_HIT: mainData["CACHE_HIT"][eventID] === "0" ? "MISS" : "HIT",
      CACHE_NAME: mainData["CACHE_NAME"][eventID],
      CYCLE: mainData["CYCLE"][eventID],
    })

    let reverseMap = {}

    addrSubset.forEach((element, idx) => {
      reverseMap[element] = idx
      let classs = Math.floor(element/addressesPerRow)
      if (classs in addrClasses) {
        addrClasses[classs] = [...addrClasses[classs], element]
      } else {
        addrClasses[classs] = [element]
      }
    });


    let widthIncrement = (canvasData[0] - 90) / addressesPerRow
    let heightIncrement = canvasData[1] / Object.keys(addrClasses).length
    
    let row = 0

    let currHighlight = []
    
    for (const key in addrClasses) {
      if (addrClasses.hasOwnProperty(key)) {
        let coll = 0
        for (let plotCol = 0; plotCol < addressesPerRow; plotCol++) {
          let addrKey = plotCol + (parseInt(key) * addressesPerRow);
          if (addrKey in reverseMap) {
            ctx.fillStyle = "#08D9D6";
            ctx.fillRect(coll, row, widthIncrement * 0.9, heightIncrement * 0.9);
            let realIdx = reverseMap[addrKey]
            
            if (eventNameSubset[realIdx] === "CACHE_OPERATE") {
              if (cacheHitSubset[realIdx] === "1") {
                ctx.fillStyle = "#91C788";
                ctx.fillRect(coll, row, widthIncrement * 0.9, heightIncrement * 0.9);
              } else {
                ctx.fillStyle = "#C63D2F";
                ctx.fillRect(coll, row, widthIncrement * 0.9, heightIncrement * 0.9);
              }
            }

            if (realIdx == eventID) {
              currHighlight = [coll + ((widthIncrement * 0.9) / 2), row + ((heightIncrement * 0.9) / 2), addrKey]
            }
            
          }

          coll += widthIncrement
        }
      }
      row += heightIncrement
    }

    ctx.beginPath();
    ctx.fillStyle = "black";
    ctx.arc(currHighlight[0], currHighlight[1], 5, 0, 2 * Math.PI);
    ctx.fill(); 
    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.arc(currHighlight[0], currHighlight[1], 3, 0, 2 * Math.PI);
    ctx.fill(); 
    ctx.fillStyle = "black";
    ctx.font = "18px mono";
    ctx.fillText(currHighlight[2], currHighlight[0] + 8, currHighlight[1]); 


  }

  const handleFileChange = async (e) => {
    setLoading(true)
    if (e.target.files) {
      try {
        const file = e.target.files[0];
        const fileUrl = URL.createObjectURL(file);
        const response = await fetch(fileUrl);
        const text = await response.text();
        const lines = text.split("\n");
        const _data = lines.map((line) => line.split(","));
        let finalData = {}
        for (let i = 0; i < _data[0].length; i++) {
          finalData[_data[0][i].trim()] = []
        }
        for (let j = 1; j < _data.length; j++) {
          let currLine = _data[j]
          for (let i = 0; i < _data[0].length; i++) {
            finalData[_data[0][i].trim()] = [...finalData[_data[0][i].trim()], (_data[0][i].trim() == "ADDR" || _data[0][i].trim() == "CYCLE") ? parseInt(currLine[i]) : currLine[i]];
          }
        }
        setSliderLimits([0, finalData["CYCLE"].length - 2])
        setEventID(0)
        setMainData(finalData)
        setEventData({
          EVENT_NAME: finalData["EVENT_NAME"][eventID],
          ADDR: finalData["ADDR"][eventID],
          IP: finalData["IP"][eventID],
          TYPE: finalData["TYPE"][eventID],
          CACHE_HIT: finalData["CACHE_HIT"][eventID] === "0" ? "MISS" : "HIT",
          CACHE_NAME: finalData["CACHE_NAME"][eventID],
          CYCLE: finalData["CYCLE"][eventID],
        })
        handlePlot()
        

        console.log(finalData)
      } catch (error) {
        console.error(error);
      }
    }
    setLoading(false)
  };


  const handleASMR = () => {
    if (ASMR) {
      setASMR(false)
      clearInterval(ASMRTimer)
    } else {
      setASMR(true)
      let counter = eventID
      let max = mainData["CYCLE"].length - 1

      
      let interval = setInterval(() => {
        console.log("ASMR", counter)
        if (counter != max) {
          setEventID(counter)
          counter++
        }
      }, timePerEvent <= 0 ? 80 : timePerEvent )
      setASMRTimer(interval)
    }
  }
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {/* <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            CS683 '23 - Meam viz
          </Typography>
        </Toolbar>
      </AppBar> */}
      <div style={{ padding: 20 }}>
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <Item style={{ marginBottom: 10, padding: 10 }}>
              <Typography variant='body2'>
                The definitive - <i> My prefetcher is doing what I think its doing proof ;)</i>
              </Typography>
            </Item>
            <Item style={{ marginBottom: 10, padding: 10 }}>
              <div style={{ paddingLeft: 20,  paddingRight: 20 }}>
                <code>
                  Cache lines per row: <br/> <b>{addressesPerRow}</b>
                </code>
                <Slider
                  disabled={!mainData.ADDR}
                  step={50}
                  color="secondary"
                  type="range"
                  size="small"
                  min={100}
                  max={2000}
                  onChange={(e) => setAddressesPerRow(e.target.value)}
                  value={addressesPerRow}
                />
              </div>

              <div style={{ paddingLeft: 20,  paddingRight: 20 }}>
                <code>
                  Event Id: <b>{eventID}</b> <br/> Clock Cycle: <b>{eventData.CYCLE}</b> 
                </code>
                <Slider
                  color="secondary"
                  disabled={!mainData.ADDR || ASMR}
                  type="range"
                  min={sliderLimits[0]}
                  max={sliderLimits[1]}
                  size="small"
                  onChange={(e) => setEventID(e.target.value)}
                  value={eventID}
                />
              </div>

            </Item>

            

            <Item style={{ marginBottom: 10, padding: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <TextField disabled={!mainData.ADDR} size="small" variant="outlined" label="Time(ms)/Event" value={timePerEvent} onChange={(e) => setTimePerEvent(e.target.value)} />
                <Button size="small" disabled={!mainData.ADDR} onClick={handleASMR} >
                  {!ASMR && "Start ASMR"}
                  {ASMR && "Stop ASMR"}
                </Button>
              </div>

            </Item>

            <Item style={{ marginBottom: 10, padding: 10 }}>
              {
                <div>
                  <Button component="label" color={ mainData.ADDR ? 'secondary' : 'primary' } variant="outlined" startIcon={<CloudUploadIcon />}>
                    {
                      mainData.ADDR && "Upload Another"
                    }
                    {
                      !mainData.ADDR && "Upload Trace"
                    }
                    <VisuallyHiddenInput type="file" accept=".csv" onChange={handleFileChange} />
                  </Button>
                  <Divider style={{ marginTop: 15, marginBottom: 15 }} />
                </div>
              }
              <Link href="https://github.com/meetesh06/CS683-ChampSimPrefetcherViz/tree/main/examples">
                Example traces
              </Link>

              <Link href="https://github.com/meetesh06/CS683-ChampSimPrefetcherViz">
                Generate trace
              </Link>

              
              {
                mainData.ADDR && 
                <div style={{ textAlign: 'left' }}>
                  <JsonView data={eventData} shouldExpandNode={allExpanded} style={darkStyles} />
                </div>
              }
            </Item>
          </Grid>
          <Grid item xs={9}>
            <Item style={{ padding: 10, display: 'flex', justifyContent: 'center' }}>
              <canvas id="myCanvas" style={{ borderRadius: 10, opacity: 0.95}} width={canvasData[0]} height={canvasData[1]}></canvas>
              {loading && <LinearProgress />}
            </Item>
          </Grid>
        </Grid>
      </div>
    </ThemeProvider>
  );
}

export default App;
