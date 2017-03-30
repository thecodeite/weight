import React from 'react'
import moment from 'moment'

const Fatt = React.createClass({
  getInitialState () {
    return this.calcState(moment())
  },
  calcState (month) {
    month = moment(moment(month).format(isoMonthOnly))
    const firstDay = month.clone()
    while (firstDay.isoWeekday() !== 1) {
      firstDay.add(-1, 'days')
    }

    const lastDay = month.clone().add(1, 'month').add(-1, 'day')
    while (lastDay.isoWeekday() !== 7) {
      lastDay.add(1, 'days')
    }

    return {
      monthName: month.format('MMMM YYYY'),
      month,
      firstDay,
      lastDay
    }
  },
  move (months) {
    const newState = this.calcState(this.state.month.clone().add(months, 'month'))
    this.setState(newState)

    const from = newState.firstDay.format(isoDateOnly)
    const to = newState.lastDay.format(isoDateOnly)
    stores.timeslipStore.loadRange(from, to)
  },
  componentWillMount () {
    stores.taskStore.loadActiveTasks()
    stores.projectStore.loadActiveProjects()

    const from = this.state.firstDay.format(isoDateOnly)
    const to = this.state.lastDay.format(isoDateOnly)
    stores.timeslipStore.loadRange(from, to)
  },
  render () {
    return <div>
      <div className='headerBar'>
        <a onClick={() => this.move(-1)}>Prev</a>
        <h1>{this.state.monthName}</h1>
        <a onClick={() => this.move(1)}>Next</a>
        <TaskManager />
        <AddTaskBar />
      </div>
      <Month month={this.state.month} firstDay={this.state.firstDay} lastDay={this.state.lastDay} />
    </div>
  }
})

module.exports = Fatt
export default Fatt
