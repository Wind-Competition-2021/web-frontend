// import { DateTime } from "luxon";
import axios from "axios";
import { DateTime } from "luxon";
import React, { useState } from "react";
import DayPickerInput from "react-day-picker/DayPickerInput";
import { Button, Dimmer, Divider, Form, Grid, Input, Loader, Menu } from "semantic-ui-react";
import { DateIntervalDataBundle, Quarter, QuarterDataBundle, StatementType, typeMapping, typeSequence } from "../../../../client/statement-types";
import { client } from "../../../../client/WindClient";
import { checkValidDateRange, isFutureDate, toDateString, useDocumentTitle } from "../../../../common/Util";
import { showErrorModal } from "../../../../dialogs/Dialog";
import AnalysisStockSearch from "../AnalysisStockSearch";
import StatementTableView from "./StatementTableView";


const StatementAnalysisView: React.FC<{
}> = () => {
    useDocumentTitle("分析");
    const today = DateTime.now();
    const prevQuarter = today.minus({ months: 3 });
    /**
     * 当前要分析的股票
     */
    const [currentStock, setCurrentStock] = useState<string | null>(null);

    /**
     * 日期区间起始
     */
    const [beginDate, setBeginDate] = useState<Date>(today.minus({ days: 30 }).toJSDate());
    /**
     * 日期区间结束
     */
    const [endDate, setEndDate] = useState<Date>(today.toJSDate());
    /**
     * 年份
     */
    const [year, setYear] = useState<number>(prevQuarter.year);
    /**
     * 季度
     */
    const [quarter, setQuarter] = useState<Quarter>(prevQuarter.quarter as Quarter);
    const [fetching, setFetching] = useState(false);
    const [currentTab, setCurrentTab] = useState<StatementType>("profitability");
    const [dateBundle, setDateBundle] = useState<DateIntervalDataBundle | null>(null);
    const [quarterBundle, setQuarterBundle] = useState<QuarterDataBundle | null>(null);
    const fetchData = async () => {
        if (!checkValidDateRange(beginDate, endDate)) {
            showErrorModal("开始日期不得晚于结束日期");
            return;
        }
        if ((today.year === year && today.quarter <= quarter) || today.year < year) {
            showErrorModal("你不能选择当前季度或者未来的季度");
            return;
        }
        setFetching(true);
        try {
            const [dateBundle, quarterBundle] = (await axios.all([
                client.getDateIntervalStockStatement(currentStock!, toDateString(beginDate), toDateString(endDate)) as Promise<any>,
                client.getQuarterStockStatement(currentStock!, year, quarter) as Promise<any>
            ])) as [DateIntervalDataBundle, QuarterDataBundle];
            setDateBundle(dateBundle);
            setQuarterBundle(quarterBundle);

        } catch (e) {
            throw e;
        } finally {
            setFetching(false);
        }
    };
    return <Grid columns="1">
        <Grid.Column >
            <AnalysisStockSearch
                setSelectedStock={setCurrentStock}
            ></AnalysisStockSearch>
        </Grid.Column>
        <Grid.Column >
            {!currentStock ? <div></div> : <div>
                <Dimmer active={fetching}>
                    <Loader>加载中...</Loader>
                </Dimmer>
                <Grid columns="2">
                    <Grid.Column width="4">
                        <Menu fluid vertical tabular>
                            {typeSequence.map((item, i) => <Menu.Item
                                key={i}

                                active={item === currentTab}
                                onClick={() => setCurrentTab(item)}
                            >{typeMapping[item].title}</Menu.Item>)}
                        </Menu>
                    </Grid.Column>
                    <Grid.Column stretched width="12">
                        <Grid columns="1">
                            <Grid.Column>
                                <Form>
                                    <Form.Group>
                                        {typeMapping[currentTab].format === "date" ? <>
                                            <Form.Field>
                                                <label>日期开始</label>
                                                <DayPickerInput
                                                    value={beginDate}
                                                    onDayChange={d => {
                                                        if (isFutureDate(d)) {
                                                            showErrorModal("你不能选择未来的日期");
                                                            return;
                                                        }
                                                        setBeginDate(d);
                                                    }}
                                                ></DayPickerInput>
                                            </Form.Field>
                                            <Form.Field>
                                                <label>日期结束</label>
                                                <DayPickerInput
                                                    value={endDate}
                                                    onDayChange={d => {
                                                        if (isFutureDate(d)) {
                                                            showErrorModal("你不能选择未来的日期");
                                                            return;
                                                        }
                                                        setEndDate(d);
                                                    }}
                                                ></DayPickerInput>
                                            </Form.Field></>
                                            :
                                            <><Form.Field>
                                                <label>年份</label>
                                                <Input type="number"
                                                    value={year}
                                                    onChange={(_, d) => setYear(parseInt(d.value))}
                                                ></Input>
                                            </Form.Field>
                                                <Form.Field>
                                                    <label>季度</label>
                                                    <Button.Group>
                                                        {([1, 2, 3, 4,] as Quarter[]).map(q => <Button
                                                            key={q}
                                                            onClick={() => {
                                                                if ((today.year === year && today.quarter <= q) || today.year < year) {
                                                                    showErrorModal("你不能选择当前季度或者未来的季度");
                                                                    return;
                                                                }
                                                                setQuarter(q);
                                                            }}
                                                            active={quarter === q}
                                                        >{q}</Button>)}
                                                    </Button.Group>
                                                </Form.Field></>
                                        }
                                        <Form.Field>
                                            <label>操作</label>
                                            <Form.Button color="green" onClick={fetchData}>
                                                应用日期更改
                                            </Form.Button>
                                        </Form.Field>
                                    </Form.Group>
                                </Form>
                                <Divider></Divider>
                            </Grid.Column>
                            <Grid.Column>
                                <StatementTableView
                                    dateBundle={dateBundle!}
                                    quarterBundle={quarterBundle!}
                                    type={currentTab}
                                ></StatementTableView>
                            </Grid.Column>
                        </Grid>
                    </Grid.Column>
                </Grid>
            </div>}
        </Grid.Column>
    </Grid>;
};

export default StatementAnalysisView;
