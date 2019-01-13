/*var activeTabId = null;
var contentPort = null;

chrome.tabs.onUpdated.addListener (onTabUpdated);

chrome.runtime.onConnect.addListener (function (port)
                                      {
                                          contentPort = port;

                                          contentPort.onDisconnect.addListener (function ()
                                                                                {
                                                                                    contentPort = null;
                                                                                });
                                      });

chrome.tabs.onActivated.addListener (function (info)
                                     {
                                         activeTabId = info.tabId;
                                     });

function onTabUpdated (tabId, info, tab)
{
//    if (info.status === 'complete' && tab.url.substr (0, 4) === 'http')
//        chrome.tabs.executeScript (tabId, { code: 'startConnectionPoller ();' });
}*/

var connectTimer = null;
var nmeaPort     = null;
var dataStorage  = new DataStorage ();
var nmeaData     = {};

runConnectTimer ();

function runConnectTimer ()
{
    connectTimer = setInterval (tryToConnect, 1000);
}

function tryToConnect ()
{
    if (!nmeaPort)
    {
        nmeaPort = chrome.runtime.connect ('bgffefgpkclngeknmiholfpegmclpldb');

        if (nmeaPort)
        {
            clearInterval (connectTimer);

            connectTimer = null;

            nmeaPort.onMessage.addListener (onMsg);
            nmeaPort.onDisconnect.addListener (function ()
                                               {
                                                   runConnectTimer ();
                                               });
        }
    }
}

function onMsg (ds)
{
    nmeaData = {};

    for (var key in ds.data)
    {
        var val = ds.data [key].data;

        nmeaData [key] = { value: val, text: DataStorage.getTextValue (key, val) };
    }

    chrome.tabs.query ({ active: true, currentWindow: true, url: ['http://*/*', 'https://*/*'] },
                       function (tabs)
                       {
                           if (tabs.length > 0)
                           {
                               var json = JSON.stringify (nmeaData);
                               var code = 'var div = document.getElementById (\'nmeaData\'); ' +
                                          'if (!div) { div = document.createElement (\'div\'); div.id = \'nmeaData\'; div.hidden = true; document.body.appendChild (div); }' +
                                          'div.innerText = \'' + json + '\';';
//                               var code = 'document.getElementById (\'nmeaData\').innerText = \'' + json + '\';';

                               chrome.tabs.executeScript (tabs[0].id, { code: code });
                           }
                       });
}
