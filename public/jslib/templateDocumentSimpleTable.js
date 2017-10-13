/**
 * Created by dmkits on 18.12.16.
 */
define(["dojo/_base/declare", "app", "templateDocumentBase", "hTableSimpleFiltered"],
    function(declare, APP, DocumentBase, HTable) {
        return declare("TemplateDocumentSimpleTable", [DocumentBase], {
            /*
            * args: {titleText, dataURL, dataURLCondition={...}, rightPane:true/false, rightPaneWidth,
            *       buttonUpdate, buttonPrint, buttonExportToExcel,
            *       printFormats={ ... } }
            * default:
            * rightPane=false,
            * buttonUpdate=true, buttonPrint=true,
            * default printFormats={ dateFormat:"DD.MM.YY", numericFormat:"#,###,###,###,##0.#########", currencyFormat:"#,###,###,###,##0.00#######" }
            * */
            constructor: function(args,parentName){
                this.titleText="";
                this.dataURL=null; this.dataURLCondition=null;
                this.buttonUpdate= true;
                this.buttonPrint= true;
                this.buttonExportToExcel= true;
                this.printFormats= { dateFormat:"DD.MM.YY", numericFormat:"#,###,###,###,##0.#########", currencyFormat:"#,###,###,###,##0.00#######" };
                this.detailContentErrorMsg="Failed get data!";
                this.srcNodeRef = document.getElementById(parentName);
                declare.safeMixin(this,args);
                if(args.rightPane===true){
                    this.rightContainerParams={style:"margin:0;padding:0;"};
                    if(args.rightPaneWidth!==undefined) this.rightContainerParams.style+= "width:"+args.rightPaneWidth.toString()+"px;";
                    else this.rightContainerParams.style+= "width:100px;";
                }
            },

            createTopContent: function(){
                this.topContent = this.setChildContentPaneTo(this, {region:'top', style:"margin:0;padding:0;border:none"});
                var topTable = this.addTableTo(this.topContent.containerNode);
                this.topTableRow = this.addRowToTable(topTable);
                var topTableHeaderCell = this.addLeftCellToTableRow(this.topTableRow,1);
                var topHeaderText = document.createElement("h1");
                topHeaderText.appendChild(document.createTextNode(this.titleText));
                topTableHeaderCell.appendChild(topHeaderText);
                var btnsTable = this.addTableTo(this.topContent.containerNode);
                this.btnsTableRow = this.addRowToTable(btnsTable);
                var topTableErrorMsg = this.addTableTo(this.topContent.containerNode);
                var topTableErrorMsgRow=this.addRowToTable(topTableErrorMsg);
                this.topTableErrorMsg= this.addLeftCellToTableRow(topTableErrorMsgRow,1);
            },
            createContentTable: function(HTable, params){
                if (!params) params={};
                if (!params.region) params.region='center';
                if (!params.style) params.style="margin:0;padding:0;";
                if (params.readOnly===undefined) params.readOnly=true;
                if (params.wordWrap===undefined) params.wordWrap=true;
                if (params.useFilters===undefined) params.useFilters=true;
                if (params.allowFillHandle===undefined) params.allowFillHandle=false;
                this.contentTable = new HTable(params);
                this.addChild(this.contentTable);
                var instance = this;
                this.contentTable.onUpdateContent = function(){ instance.onUpdateTableContent(); };
                this.contentTable.onSelect = function(firstSelectedRowData, selection){
                    this.setSelection(firstSelectedRowData, selection);
                    instance.onSelectTableContent(firstSelectedRowData, selection);
                };
            },
            createRightContent: function(params){
                if(this.rightContainerParams){
                    this.rightContainerParams.region='right';
                    this.rightContainer= this.setContentPane(this.rightContainerParams);
                    this.addChild(this.rightContainer);
                }
            },
            postCreate: function(){
                this.createTopContent();
                this.createContentTable(HTable);
                this.createRightContent();
            },
            loadTableContent: function(additionalCondition){                                                            //console.log("TemplateDocumentSimpleTable loadTableContent");
                var condition = (this.dataURLCondition)?this.dataURLCondition:{};
                if (this.beginDateBox) condition[this.beginDateBox.conditionName.replace("=","~")] =
                    this.beginDateBox.format(this.beginDateBox.get("value"),{selector:"date",datePattern:"yyyy-MM-dd"});
                if (this.endDateBox) condition[this.endDateBox.conditionName.replace("=","~")] =
                    this.endDateBox.format(this.endDateBox.get("value"),{selector:"date",datePattern:"yyyy-MM-dd"});
                if (this.btnsConditions) {
                    for(var ibtn=0;ibtn<this.btnsConditions.length;ibtn++){
                        var checkBtn=this.btnsConditions[ibtn], btnConditions=checkBtn.conditions;
                        if (checkBtn.checked===true)
                            for(var conditionItemName in btnConditions) condition[conditionItemName]=btnConditions[conditionItemName];
                    }
                }
                if (additionalCondition)
                    for(var addConditionItemName in additionalCondition)
                        condition[addConditionItemName.replace("=","~")]=additionalCondition[addConditionItemName];
                this.contentTable.setContentFromUrl({url:this.dataURL,condition:condition, clearContentBeforeLoad:true});
            },
            reloadTableContentByCondition: function(additionalCondition){                                                     //console.log("TemplateDocumentSimpleTable reloadTableContentByCondition condition=",condition);
                this.loadTableContent(additionalCondition);
            },
            setDetailContentErrorMsg: function(detailContentErrorMsg){
                this.detailContentErrorMsg= detailContentErrorMsg;
                return this;
            },
            getTableContent: function(){
                return this.contentTable.getContent();
            },
            getTableContentSelectedRow: function(){
                return this.contentTable.getSelectedRow();
            },
            getTableContentItemSum: function(tableItemName){
                return this.contentTable.getContentItemSum(tableItemName);
            },
            onUpdateTableContent: function(){
                if(this.contentTable.getDataError())
                    this.topTableErrorMsg.innerHTML= "<b style='color:red'>"+this.detailContentErrorMsg+" Reason: "+this.contentTable.getDataError()+"</b>";
                else
                    this.topTableErrorMsg.innerHTML="";
                if (!this.totals) return;
                for(var tableItemName in this.totals){
                    var totalBox = this.totals[tableItemName];
                    totalBox.updateValue();
                }
                if (this.infoPane&&this.infoPane.updateCallback) this.infoPane.updateCallback(this.infoPane, this);
                this.layout();
            },
            onSelectTableContent: function(firstSelectedRowData, selection){
                if (this.infoPane&&this.infoPane.updateCallback) this.infoPane.updateCallback(this.infoPane, this);
            },
            /*
             * params : { initValueDate:"curDate"/"curMonthBDate"/"curMonthEDate" }
             * default: initValueDate="curDate"
             */
            addBeginDateBox: function(labelText, conditionName, params){
                var initValueDate=null;
                if (!params||params.initValueDate===undefined||params.initValueDate==="curDate") initValueDate= APP.today();
                else if (params.initValueDate==="curMonthBDate") initValueDate= APP.curMonthBDate();
                else if (params.initValueDate==="curMonthEDate") initValueDate= APP.curMonthEDate();
                this.beginDateBox= this.addTableCellDateBoxTo(this.topTableRow,
                    {labelText:labelText, labelStyle:"margin-left:5px;", cellWidth:87, cellStyle:"text-align:right;",
                        inputParams:{conditionName:conditionName}, initValueDate:initValueDate});
                var instance = this;
                this.beginDateBox.onChange = function(){
                    instance.loadTableContent();
                };
                return this;
            },
            addEndDateBox: function(labelText, conditionName, initValueDate){
                if (initValueDate===undefined||initValueDate===null) initValueDate= APP.today();
                this.endDateBox= this.addTableCellDateBoxTo(this.topTableRow,
                    {labelText:labelText, labelStyle:"margin-left:5px;", cellWidth:87, cellStyle:"text-align:right;",
                        inputParams:{conditionName:conditionName}, initValueDate:initValueDate});

                this.addPreviousDayBtn(this.endDateBox,this.topTableRow);
                this.addNextDayBtn(this.endDateBox,this.topTableRow);

                var instance = this;
                this.endDateBox.onChange = function(){
                    instance.loadTableContent();
                };
                return this;
            },
            /*
             * onClickAction = function(this.contentTableContent,this.contentTableInstance)
             */
            addBtn: function(labelText, width, onClickAction){
                if (width===undefined) width=100;
                var btn= this.addTableCellButtonTo(this.topTableRow, {labelText:labelText, cellWidth:width, cellStyle:"text-align:right;"});
                var instance= this;
                btn.onClick = function(){
                    if (onClickAction) onClickAction(instance.getTableContent(),instance.contentTable);
                };
                return this;
            },
            addBtnUpdate: function(width, labelText){
                if (width===undefined) width=200;
                if (!labelText) labelText="Обновить";
                this.btnUpdate= this.addTableCellButtonTo(this.topTableRow, {labelText:labelText, cellWidth:width, cellStyle:"text-align:right;"});
                var instance= this;
                this.btnUpdate.onClick = function(){
                    instance.loadTableContent();
                };
                return this;
            },
            addBtnPrint: function(width, labelText, printFormats){
                if (width===undefined) width=100;
                if (!this.btnUpdate) this.addBtnUpdate(width);
                if (!labelText) labelText="Печатать";
                this.btnPrint= this.addTableCellButtonTo(this.topTableRow, {labelText:labelText, cellWidth:1, cellStyle:"text-align:right;"});
                var instance = this;
                this.btnPrint.onClick = function(){
                    instance.doPrint();
                };
                return this;
            },
            addBtnExportToExcel: function(width, labelText){
                if (width===undefined) width=100;
                if (!this.btnUpdate) this.addBtnUpdate(width);
                if (!labelText) labelText="Экспорт в excel";
                this.btnExportToExcel= this.addTableCellButtonTo(this.topTableRow, {labelText:labelText, cellWidth:1, cellStyle:"text-align:right;"});
                var instance = this;
                this.btnExportToExcel.onClick = function(){
                    instance.exportTableContentToExcel();
                };
                return this;
            },
            addCheckBtnCondition: function(width, labelText, conditions){
                if (width===undefined) width=100;
                var btnChecked= false;
                if (!this.btnsConditions) {
                    this.btnsConditions=[];
                    btnChecked= true;
                }
                var checkBtnCondition= this.addTableCellButtonTo(this.btnsTableRow, {labelText:labelText, cellWidth:width, cellStyle:"text-align:center;", btnChecked:btnChecked});
                this.btnsConditions.push(checkBtnCondition);
                checkBtnCondition.btnsConditions=this.btnsConditions;
                checkBtnCondition.conditions= conditions;
                var instance = this;
                checkBtnCondition.onClick = function(){
                    for(var i=0;i<this.btnsConditions.length;i++) {
                        var checkBtn = this.btnsConditions[i];
                        if (checkBtn != this) checkBtn.set("checked", false, false); else checkBtn.set("checked", true, false);
                    }
                    instance.loadTableContent();
                };
                return this;
            },

            setTotalContent: function(){
                if (!this.totalContent) {
                    this.totalContent = this.setChildContentPaneTo(this, {region:'bottom',style:"margin:0;padding:0;border:none;"});
                    this.totalTable = this.addTableTo(this.totalContent.containerNode);
                    this.addTotalRow();
                }
                return this;
            },
            addTotalRow: function(){
                this.totalTableRow = this.addRowToTable(this.totalTable);
                if (!this.totalTableData) this.totalTableData= [];
                this.totalTableData.push([]);
                return this;
            },
            addTotalEmpty: function(width){
                this.setTotalContent();
                this.addLeftCellToTableRow(this.totalTableRow, width);
                var totalTableRowData= this.totalTableData[this.totalTableData.length-1];
                totalTableRowData.push(null);
                return this;
            },
            addTotalText: function(text, width){
                this.setTotalContent();
                var totalTableCell = this.addLeftCellToTableRow(this.totalTableRow, width);
                //var totalTableCellDiv = document.createElement("div");
                //totalTableCellDiv.setAttribute("style","width:"+width+"px");
                //totalTableCell.appendChild(totalTableCellDiv);
                if (text) totalTableCell.appendChild(document.createTextNode(text));
                return this;
            },
            /*
             * params { style, inputStyle, pattern }
             * default pattern="#,###,###,###,##0.#########"
             */
            addTotalNumberBox: function(labelText, width, tableItemName, params){
                this.setTotalContent();
                var style="",inputStyle="", pattern="#,###,###,###,##0.#########";
                if (params&&params.style) style=params.style;
                if (params&&params.inputStyle) inputStyle=params.inputStyle;
                if (params&&params.pattern) pattern=params.pattern;
                var totalNumberTextBox= this.addTableCellNumberTextBoxTo(this.totalTableRow,
                    {cellWidth:width, cellStyle:"text-align:right;",
                        labelText:labelText, labelStyle:style, inputStyle:"text-align:right;"+style+inputStyle,
                        inputParams:{constraints:{pattern:pattern}, readOnly:true,
                            /*it's for print*/cellWidth:width, labelText:labelText, printStyle:style, inputStyle:"text-align:right;"+inputStyle, typeFormat:pattern } });
                if (!this.totals) this.totals = {};
                this.totals[tableItemName]= totalNumberTextBox;
                var totalTableRowData= this.totalTableData[this.totalTableData.length-1];
                totalTableRowData.push(totalNumberTextBox);
                return totalNumberTextBox;
            },
            /*
             * params { style, inputStyle }
             */
            addTotalCountNumberBox: function(labelText, width, params){
                var totalNumberTextBox= this.addTotalNumberBox(labelText, width, "TableRowCount", params);
                var thisInstance = this;
                totalNumberTextBox.updateValue = function(){
                    this.set("value", thisInstance.getTableContent().length);
                };
                return this;
            },
            /*
             * params { style, inputStyle, pattern }
             * default pattern="#,###,###,###,##0.#########"
             */
            addTotalSumNumberTextBox: function(labelText, width, tableItemName, params){
                var totalNumberTextBox= this.addTotalNumberBox(labelText, width, tableItemName, params);
                var thisInstance = this;
                totalNumberTextBox.updateValue = function(){
                    this.set("value", thisInstance.getTableContentItemSum(tableItemName));
                };
                return this;
            },

            addInfoPane: function(width, updateInfoPaneCallback){
                if (!this.infoPane) {
                    if (width===undefined) width=100;
                    this.infoPane = this.setChildContentPaneTo(this, {region:'right', style:"height:100%;width:"+width+"px;"});
                    this.addChild(this.infoPane);
                    if (updateInfoPaneCallback) this.infoPane.updateCallback = updateInfoPaneCallback;
                }
                return this;
            },
            /*
             * contentAction= function(toolPane, this.contentTable, this)
             * contentAction calls on this.contentTable updated or changed selected row
             */
            addToolPane: function(title, contentAction){
                if(!this.rightContainer) {
                    console.log("WARNING! Failed addToolPane! Reason: no rightContainer!");
                    return this;
                }
                if (!this.toolPanes) this.toolPanes= [];
                var actionsTitlePane= this.addChildTitlePaneTo(this.rightContainer,{title:title});
                if(contentAction) actionsTitlePane.contentAction= contentAction;
                this.toolPanes.push(actionsTitlePane);
                this.addTableTo(actionsTitlePane.containerNode);
                return this;
            },

            addToolPaneBR: function(){
                var row= this.addRowToTable(this.toolPanes[this.toolPanes.length-1].containerNode.lastChild);
                this.addLeftCellToTableRow(row).innerHTML="<br>";
                return this;
            },

            /**
             * tableRowAction = function(contentTableRowData, actionParams, contentTableUpdatedRowData, startNextAction, finishedAction)
             *      startNextAction = function(true/false), if false- restart current action
             *      actionParams = { tableInstance, toolPanes, thisInstance }
             */
            addContentTableRowAction: function(actionName, tableRowAction){
                if(!this.contentTableActions) this.contentTableActions={};
                this.contentTableActions[actionName] = { tableRowActionFunction:tableRowAction };
                return this;
            },
            /**
             * actions = { startAction, tableRowAction, endAction }
             *      startAction = function(contentTableRowsData, actionParams, startTableRowActions)
             *      tableRowAction = function(contentTableRowData, actionParams, contentTableUpdatedRowData, startNextAction, finishedAction)
             *          startNextAction = function(true/false), if false- restart current action
             *      endAction = function(contentTableRowsData, actionParams)
             *      actionParams = { contentTableInstance, toolPanes, thisInstance }
             */
            addContentTableRowsAction: function(actionName, actions){
                if(!actions) return this;
                if(!this.contentTableActions) this.contentTableActions={};
                this.contentTableActions[actionName] = {
                    startActionFunction:actions.startAction,
                    tableRowActionFunction:actions.tableRowAction,//function(tableContentRowData, params, tableUpdatedRowData, startNextAction, finishedAction)
                    endActionFunction:actions.endAction
                };
                return this;
            },

            /**
             * actionParams = { btnStyle, btnParams, actionFunction, contentTableActionName, beforeContentTableRowsAction }
             *      actionFunction = function(contentTableRowsData, actionParams)
             *          actionParams = { contentTableInstance, toolPanes, thisInstance }
             *      beforeContentTableRowsAction = function(contentTableRowsData, actionParams, startContentTableRowsAction)
             *          actionParams = { contentTableInstance, toolPanes, thisInstance }
             *          startContentTableRowsAction= function(contentTableRowsDataForAction)
             */
            addToolPaneActionButton: function(label, actionParams){
                if(!this.rightContainer) {
                    console.log("WARNING! Failed addToolPaneActionButton! Reason: no rightContainer!");
                    return this;
                }
                if (!this.toolPanes||this.toolPanes.length==0) this.addToolPane("");
                var actionsTableRow= this.addRowToTable(this.toolPanes[this.toolPanes.length-1].containerNode.lastChild);
                if(!actionParams) actionParams={};
                var actionButton= this.addTableCellButtonTo(actionsTableRow, {labelText:label, cellWidth:0,
                    btnStyle:actionParams.btnStyle, btnParameters:actionParams.btnParams});
                if (!this.toolPanesActionButtons) this.toolPanesActionButtons={};
                actionParams.contentTableInstance=this.contentTable;
                actionParams.toolPanes=this.toolPanes;
                actionParams.thisInstance=this;
                var thisInstance=this;
                if(actionParams.actionFunction) {
                    actionButton.onClick=function(){
                        actionParams.actionFunction(thisInstance.getTableContent(),actionParams);
                    };
                    return this;
                }
                var contentTableRowAction, contentTableRowsActionFunction;
                if (actionParams.contentTableActionName)
                    contentTableRowAction= this.contentTableActions[actionParams.contentTableActionName];
                if(contentTableRowAction&&contentTableRowAction.startActionFunction&&contentTableRowAction.tableRowActionFunction){
                    contentTableRowsActionFunction= function(tableContentForAction,actionParams){
                        contentTableRowAction.startActionFunction(tableContentForAction, actionParams,
                            /*startContentTableRowsAction*/function(){
                                thisInstance.contentTable.updateRowsAction(tableContentForAction, actionParams,
                                    contentTableRowAction.tableRowActionFunction, contentTableRowAction.endActionFunction);
                            });
                    };
                } else if(contentTableRowAction&&contentTableRowAction.tableRowActionFunction){
                    contentTableRowsActionFunction= function(tableContentForAction,actionParams){
                        thisInstance.contentTable.updateRowsAction(tableContentForAction, actionParams,
                            contentTableRowAction.tableRowActionFunction, contentTableRowAction.endActionFunction);
                    };
                }
                if(actionParams.beforeContentTableRowsAction){
                    actionButton.onClick= function(){
                        var contentTableRowsData=thisInstance.getTableContent();
                        actionParams.beforeContentTableRowsAction(contentTableRowsData,actionParams,
                            function(contentTableRowsDataForAction){
                                if(!contentTableRowsDataForAction) contentTableRowsDataForAction=contentTableRowsData;
                                if(contentTableRowsActionFunction)
                                    contentTableRowsActionFunction(contentTableRowsDataForAction, actionParams);
                            });
                    }
                } else if(contentTableRowsActionFunction)
                    actionButton.onClick= function(){
                        var contentTableRowsData=thisInstance.getTableContent();
                        contentTableRowsActionFunction(contentTableRowsData, actionParams);
                    };
                return this;
            },

            /**
             * actionParams = { btnStyle, btnParams, actionFunction, contentTableActionName, beforeContentTableRowsAction }
             *      actionFunction = function(selectedTableContent, actionParams)
             *      beforeContentTableRowsAction = function(selectedTableContent, actionParams, startContentTableRowsAction)
             *          actionParams = { contentTableInstance, toolPanes, thisInstance }
             *          startContentTableRowsAction= function(contentTableRowsDataForAction)
             */
            addContentTablePopupMenuAction: function(itemName, actionParams){
                var thisInstance=this, thisContentTable= this.contentTable;
                if(!actionParams) actionParams={};
                actionParams.contentTableInstance=thisContentTable;
                actionParams.toolPanes=thisInstance.toolPanes;
                actionParams.thisInstance=thisInstance;
                var menuItemActionFunction;
                if(actionParams.actionFunction) {
                    menuItemActionFunction= actionParams.actionFunction;
                } else {
                    var contentTableRowAction= this.contentTableActions[actionParams.contentTableActionName];
                    var contentTableRowsActionFunction;
                    if(contentTableRowAction&&contentTableRowAction.startActionFunction&&contentTableRowAction.tableRowActionFunction){
                        contentTableRowsActionFunction=function(rowsDataForAction, actionParams){
                            contentTableRowAction.startActionFunction(rowsDataForAction, actionParams,
                                /*startContentTableRowsAction*/function(){
                                    thisInstance.contentTable.updateRowsAction(rowsDataForAction, actionParams,
                                        contentTableRowAction.tableRowActionFunction, contentTableRowAction.endActionFunction);
                                });
                        };
                    } else if(contentTableRowAction&&contentTableRowAction.tableRowActionFunction){
                        contentTableRowsActionFunction=function(rowsDataForAction, actionParams){
                            thisInstance.contentTable.updateRowsAction(rowsDataForAction, actionParams,
                                contentTableRowAction.tableRowActionFunction, contentTableRowAction.endActionFunction);
                        }
                    }
                    if(actionParams.beforeContentTableRowsAction){
                        menuItemActionFunction= function(rowsDataForAction, actionParams){
                            actionParams.beforeContentTableRowsAction(rowsDataForAction, actionParams,
                                function(contentTableRowsDataForAction){
                                    if(!contentTableRowsDataForAction) contentTableRowsDataForAction=rowsDataForAction;
                                    if(contentTableRowsActionFunction)
                                        contentTableRowsActionFunction(contentTableRowsDataForAction, actionParams)
                                })
                        }
                    } else if (contentTableRowsActionFunction){
                        menuItemActionFunction= contentTableRowsActionFunction;
                    }
                }
                if(!menuItemActionFunction) return this;
                thisContentTable.setMenuItem(itemName, actionParams,
                    /*menuItemAction*/function(selRowsData, actionParams){
                        var rowsDataForAction=[];
                        for(var selInd in selRowsData) rowsDataForAction.push(selRowsData[selInd]);
                        menuItemActionFunction(rowsDataForAction, actionParams);
                    });
                return this;
            },

            startUp: function(){
                if (this.buttonUpdate!=false&&!this.btnUpdate) this.addBtnUpdate();
                if (this.buttonPrint!=false&&!this.btnPrint) this.addBtnPrint();
                if (this.buttonExportToExcel!=false&&!this.btnExportToExcel) this.addBtnExportToExcel();
                this.loadTableContent();
                this.layout();
                return this;
            },

            doPrint: function(printFormats){
                var printData = {};
                if (this.titleText) {
                    this.addPrintDataSubItemTo(printData, "header",
                        {label:this.titleText, width:0, align:"center",style:"width:100%;font-size:14px;font-weight:bold;text-align:center;", contentStyle:"margin-top:5px;margin-bottom:3px;"});
                }
                var headerTextStyle="font-size:14px;", headerDateContentStyle="margin-bottom:3px;";
                if (this.beginDateBox||this.endDateBox){
                    this.addPrintDataItemTo(printData, "header", {newTable:true, style:headerTextStyle});
                    this.addPrintDataSubItemTo(printData, "header");
                    this.addPrintDataSubItemTo(printData, "header", {label:"Период:", width:80, align:"right",style:headerTextStyle, contentStyle:headerDateContentStyle});
                }
                if (this.beginDateBox)
                    this.addPrintDataSubItemTo(printData, "header",
                        {label:"с ", width:110, align:"left",style:headerTextStyle, contentStyle:headerDateContentStyle, value:this.beginDateBox.get("value"),type:"date"});
                if (this.endDateBox)
                    this.addPrintDataSubItemTo(printData, "header",
                        {label:"по ", width:110, align:"left",style:headerTextStyle, contentStyle:headerDateContentStyle, value:this.endDateBox.get("value"),type:"date"});
                this.addPrintDataSubItemTo(printData, "header");
                printData.columns = this.contentTable.getVisibleColumns();                                       //console.log("doPrint printData.columns=",this.contentTable.getVisibleColumns());
                printData.data = this.contentTable.getContent();
                var totalStyle="font-size:12px;";
                if (this.totals){
                    for(var tRowIndex in this.totalTableData){
                        var tRowData= this.totalTableData[tRowIndex];
                        this.addPrintDataItemTo(printData, "total", {style:totalStyle});
                        for(var tCellIndex in tRowData){
                            var tCellData= tRowData[tCellIndex];
                            if (tCellData===null) {
                                this.addPrintDataSubItemTo(printData, "total");
                                continue
                            }
                            this.addPrintDataSubItemTo(printData, "total", {width:tCellData.cellWidth+5, style:tCellData.printStyle, align:"right",
                                contentStyle:"margin-top:3px;", label:tCellData.labelText, value:tCellData.textbox.value, type:"text", valueStyle:tCellData.inputStyle});
                        }
                    }
                }
                this.setPrintDataFormats(printData, printFormats);
                var printWindow= window.open("/print/printSimpleDocument");                                             //console.log("doPrint printWindow printData=",printData);
                printWindow["printTableContentData"]= printData;
            },
            exportTableContentToExcel:function(){
                this.requestForExcelFile({tableData:this.contentTable.getContent(),visibleColumns:this.contentTable.getVisibleColumns()});
            }
        });
    });
