import React, { useState } from "react";
import { useEffect } from "react";
import { Grid, Form, Dimmer, Loader, Divider, Table, Header } from "semantic-ui-react";
import { RealTimeDataByDay, RealTimeDataByWeek, RehabilitationType, StockInfo } from "../../../client/types";
import { client } from "../../../client/WindClient";
import { convertNumbers, toDateString, unwrapPercent, useDocumentTitle } from "../../../common/Util";
import StockCandleChart from "../stock/StockCandleChart";
import AnalysisStockSearch from "./AnalysisStockSearch";
import { DateTime } from "luxon";
import 'react-day-picker/lib/style.css';
import DayPickerInput from "react-day-picker/DayPickerInput"
const QuoteAnalysisView: React.FC<{
}> = () => {
    useDocumentTitle("分析");
    const today = DateTime.now();
    /**
     * 当前要分析的股票
     */
    const [currentStock, setCurrentStock] = useState<string | null>(null);
    /**
     * 复权类型
     */
    const [rehabilitation, setRehabilitation] = useState<RehabilitationType>("none");
    const [loading, setLoading] = useState(false);
    const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
    const [realTimeDataByDay, setRealTimeDataByDay] = useState<RealTimeDataByDay[] | null>(null);
    const [realTimeDataByWeek, setRealTimeDataByWeek] = useState<RealTimeDataByWeek[] | null>(null);
    const [candleStartDay, setCandleStartDay] = useState<Date>(today.minus({ day: 30 }).toJSDate());
    const [candleEndDay, setCandleEndDay] = useState<Date>(today.toJSDate());
    const [weekDataStartDay, setWeekDataStartDay] = useState<Date>(today.minus({ months: 6 }).toJSDate());
    const [weekDataEndDay, setWeekDataEndDay] = useState<Date>(today.toJSDate());
    const applyDate = async (withLoading: boolean) => {
        if (withLoading) setLoading(true);
        setRealTimeDataByDay(await client.getStockDayHistory(
            currentStock!,
            toDateString(candleStartDay),
            toDateString(candleEndDay),
            rehabilitation
        ));
        setRealTimeDataByWeek(await client.getStockWeekHistory(
            currentStock!,
            toDateString(weekDataStartDay),
            toDateString(weekDataEndDay),
            "week",
            rehabilitation
        ));
        if (withLoading) setLoading(false);
    };
    /**
     * 股票复权类型更改时，重新拉取数据
     */
    useEffect(() => {
        if (currentStock) {
            (async () => {
                setLoading(true);
                setStockInfo(await client.getStockDetailedInfo(currentStock));
                await applyDate(false);
                setLoading(false);
            })();
        }
        // eslint-disable-next-line
    }, [currentStock, rehabilitation]);

    return <>
        <Dimmer active={loading}>
            <Loader>加载中...</Loader>
        </Dimmer>
        <Grid columns="2">
            <Grid.Column width="6">
                <AnalysisStockSearch
                    setSelectedStock={setCurrentStock}
                ></AnalysisStockSearch>
            </Grid.Column>
            <Grid.Column width="10">
                {!currentStock ? <div>
                </div> : stockInfo && realTimeDataByDay && realTimeDataByWeek && <div>
                    <Form>
                        <Form.Group inline>
                            <label>复权类型</label>
                            <Form.Radio
                                label="前复权"
                                checked={rehabilitation === "pre"}
                                onChange={() => setRehabilitation("pre")}
                            ></Form.Radio>
                            <Form.Radio
                                label="后复权"
                                checked={rehabilitation === "post"}
                                onChange={() => setRehabilitation("post")}
                            ></Form.Radio>
                            <Form.Radio
                                label="不复权"
                                checked={rehabilitation === "none"}
                                onChange={() => setRehabilitation("none")}
                            ></Form.Radio>
                        </Form.Group>
                    </Form>
                    <Divider></Divider>
                    <Table>
                        <Table.Header>
                            <Table.Row>
                                <Table.HeaderCell>
                                    股票代码
                                </Table.HeaderCell>
                                <Table.HeaderCell>
                                    股票名
                                </Table.HeaderCell>
                                <Table.HeaderCell>
                                    股票类型
                                </Table.HeaderCell>
                                <Table.HeaderCell>
                                    行业
                                </Table.HeaderCell>
                                <Table.HeaderCell>
                                    分类
                                </Table.HeaderCell>
                                <Table.HeaderCell>
                                    上市日期
                                </Table.HeaderCell>
                                <Table.HeaderCell>
                                    退市日期
                                </Table.HeaderCell>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            <Table.Row>
                                <Table.Cell>{stockInfo.id}</Table.Cell>
                                <Table.Cell>{stockInfo.name}</Table.Cell>
                                <Table.Cell>{{ index: "指数", stock: "股票" }[stockInfo.type]}</Table.Cell>
                                <Table.Cell>{stockInfo.industry}</Table.Cell>
                                <Table.Cell>{stockInfo.classification}</Table.Cell>
                                <Table.Cell>{stockInfo.listedDate}</Table.Cell>
                                <Table.Cell>{stockInfo.delistedDate}</Table.Cell>
                            </Table.Row>
                        </Table.Body>
                    </Table>
                    <Divider></Divider>
                    <Grid columns="1">
                        <Grid.Column>
                            <Header as="h4">
                                日K线数据
                            </Header>
                            <StockCandleChart data={realTimeDataByDay}></StockCandleChart>
                        </Grid.Column>
                        <Grid.Column>
                            <Header as="h4">
                                周数据
                            </Header>
                            <div style={{ overflowY: "scroll", height: "300px" }}>
                                <Table>
                                    <Table.Header>
                                        <Table.Row>
                                            <Table.HeaderCell>日期</Table.HeaderCell>
                                            <Table.HeaderCell>开盘价</Table.HeaderCell>
                                            <Table.HeaderCell>收盘价</Table.HeaderCell>
                                            <Table.HeaderCell>最高价</Table.HeaderCell>
                                            <Table.HeaderCell>最低价</Table.HeaderCell>
                                            <Table.HeaderCell>成交量</Table.HeaderCell>
                                            <Table.HeaderCell>成交额</Table.HeaderCell>
                                            <Table.HeaderCell>换手率</Table.HeaderCell>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {realTimeDataByWeek.map((item, i) => (
                                            <Table.Row key={i}>
                                                {[
                                                    item.date,
                                                    convertNumbers(item.opening, true),
                                                    convertNumbers(item.closing, true),
                                                    convertNumbers(item.highest, true),
                                                    convertNumbers(item.lowest, true),
                                                    convertNumbers(item.volume, false),
                                                    convertNumbers(item.turnover, true),
                                                    unwrapPercent(item.turnoverRate).display
                                                ].map((val, j) => <Table.Cell key={j}>{val}</Table.Cell>)}
                                            </Table.Row>
                                        ))}
                                    </Table.Body>
                                </Table>
                            </div>
                        </Grid.Column>
                    </Grid>
                    <Divider></Divider>
                    <Form>
                        <Form.Group>
                            <Form.Field>
                                <label>K线日期范围</label>
                                <Grid columns="2">
                                    <Grid.Column textAlign="right" width="8">
                                        <DayPickerInput
                                            style={{ width: "100%" }}
                                            value={candleStartDay}
                                            onDayChange={v => setCandleStartDay(v)}
                                        ></DayPickerInput>
                                    </Grid.Column>
                                    <Grid.Column textAlign="left" width="8">
                                        <DayPickerInput
                                            value={candleEndDay}
                                            onDayChange={v => setCandleEndDay(v)}
                                        ></DayPickerInput>
                                    </Grid.Column>
                                </Grid>
                            </Form.Field>
                            <Form.Field>
                                <label>周数据日期范围</label>
                                <Grid columns="2">
                                    <Grid.Column textAlign="right" width="8">
                                        <DayPickerInput
                                            style={{ width: "100%" }}
                                            value={weekDataStartDay}
                                            onDayChange={v => setWeekDataStartDay(v)}
                                        ></DayPickerInput>
                                    </Grid.Column>
                                    <Grid.Column textAlign="left" width="8">
                                        <DayPickerInput
                                            value={weekDataEndDay}
                                            onDayChange={v => setWeekDataEndDay(v)}
                                        ></DayPickerInput>
                                    </Grid.Column>
                                </Grid>
                            </Form.Field>
                        </Form.Group>
                        <Form.Button color="green" onClick={() => applyDate(true)}>
                            应用日期更改
                        </Form.Button>
                    </Form>
                </div>}
            </Grid.Column>
        </Grid>
    </>
        ;
};

export default QuoteAnalysisView;
