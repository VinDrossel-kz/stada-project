import Header from '../header';
import {requireChatGPTUser} from '../chatgpt-auth';
import {isOrganizer} from '../authorization';
import Editor from './editor';
export const dynamic='force-dynamic';
export default async function Admin(){const user=await requireChatGPTUser('/admin');const allowed=await isOrganizer();return <><Header/><main className="main admin-panel"><p className="eyebrow">ORGANIZER DESK</p><h1>Update the climb<span>.</span></h1>{allowed?<><p className="intro">Set each team's total points. Saved scores appear for everyone.</p><p className="signed-in">Signed in as {user.email} · <a href="/signout-with-chatgpt?return_to=/">Sign out</a></p><Editor/></>:<div className="notice">This account has view-only access. Sign in with the organizer account to edit scores.<p><a className="save-button" href="/signout-with-chatgpt?return_to=/admin">Switch account</a></p></div>}</main></>}
